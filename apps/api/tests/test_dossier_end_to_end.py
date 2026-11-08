"""2D3B offline full-API integration: preview -> explicit approval -> persisted citations.

Uses a stubbed extractor and a disposable SQLite database. No real API key,
external network request or developer PostgreSQL records are involved.
"""

import hashlib
import os
from uuid import UUID

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.dossier_extraction as extraction  # noqa: E402
from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Opportunity, OpportunityAttribution  # noqa: E402

SOURCE = (
    "Example Cloud is recruiting a Platform Engineer in Toronto.\n"
    "Required: Terraform and Python experience.\n"
    "Preferred: Kubernetes security skills.\n"
)


class OfflineExtractor:
    provider = "openai"
    model = "offline-fixture-no-provider-call"

    def __init__(self):
        self.calls = []

    def extract(self, text: str):
        self.calls.append(text)
        return {
            "title": {"value": "Platform Engineer", "sourceExcerpt": "Platform Engineer"},
            "company": {"value": "Example Cloud", "sourceExcerpt": "Example Cloud"},
            "location": {"value": "Toronto", "sourceExcerpt": "Toronto"},
            "employmentType": {"value": None, "sourceExcerpt": None},
            "salaryText": {"value": None, "sourceExcerpt": None},
            "technologies": [
                {"value": "Terraform", "sourceExcerpt": "Terraform and Python"},
                {"value": "Python", "sourceExcerpt": "Terraform and Python"},
            ],
            "requirements": [
                {"text": "Terraform and Python experience", "kind": "required",
                 "sourceExcerpt": "Required: Terraform and Python experience."},
                {"text": "Kubernetes security skills", "kind": "preferred",
                 "sourceExcerpt": "Preferred: Kubernetes security skills."},
            ],
        }


@pytest.fixture
def full_stack():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    stub = OfflineExtractor()

    def session_override():
        with factory() as session:
            yield session

    app.dependency_overrides[get_database_session] = session_override
    app.dependency_overrides[extraction.get_extractor] = lambda: stub
    try:
        with TestClient(app) as client:
            created = client.post("/opportunities", json={
                "sourceText": SOURCE,
                "title": "Manual job title",
                "technologies": ["Manual Tool"],
            })
            assert created.status_code == 201, created.text
            yield client, created.json()["id"], factory, stub
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def request_preview(client, opportunity_id, consent=True):
    return client.post(f"/opportunities/{opportunity_id}/extraction-preview", json={
        "confirmExternalProcessing": consent,
    })


def selection(preview):
    return {
        "confirmApply": True,
        "sourceSha256": preview["sourceSha256"],
        # The owner explicitly chooses only empty company/location, Terraform,
        # and the required qualification. The manually entered title stays.
        "metadata": [
            {"field": key, **preview["draft"][key]}
            for key in ("company", "location")
        ],
        "technologies": [preview["draft"]["technologies"][0]],
        "requirements": [preview["draft"]["requirements"][0]],
    }


def test_full_preview_approval_and_reload_preserves_sources(full_stack):
    client, opportunity_id, factory, stub = full_stack
    before = client.get(f"/opportunities/{opportunity_id}").json()

    denied = request_preview(client, opportunity_id, consent=False)
    assert denied.status_code == 422
    assert stub.calls == []

    result = request_preview(client, opportunity_id)
    assert result.status_code == 200, result.text
    preview = result.json()
    assert preview["reviewRequired"] is True
    assert preview["saved"] is False
    assert preview["sourceSha256"] == hashlib.sha256(SOURCE.encode()).hexdigest()
    assert stub.calls == [SOURCE]
    assert client.get(f"/opportunities/{opportunity_id}").json() == before

    submitted = selection(preview)
    applied = client.post(
        f"/opportunities/{opportunity_id}/apply-reviewed-extraction", json=submitted,
    )
    assert applied.status_code == 200, applied.text
    assert applied.json()["changed"] is True
    assert applied.json()["appliedMetadata"] == ["company", "location"]
    assert applied.json()["addedTechnologies"] == ["Terraform"]
    assert applied.json()["addedRequirements"] == 1

    reopened = client.get(f"/opportunities/{opportunity_id}")
    assert reopened.status_code == 200
    saved = reopened.json()
    assert saved == applied.json()["record"]
    assert saved["sourceText"] == SOURCE
    assert saved["title"] == "Manual job title"
    assert saved["extractionStatus"] == "not_run"  # Approval does not certify model provenance.
    assert saved["technologies"] == ["Manual Tool", "Terraform"]
    assert set((a["kind"], a["field"], a["value"]) for a in saved["attributions"]) == {
        ("metadata", "company", "Example Cloud"),
        ("metadata", "location", "Toronto"),
        ("technology", "technologies", "Terraform"),
    }
    assert all(a["sourceExcerpt"] in SOURCE and
               a["sourceSha256"] == preview["sourceSha256"] for a in saved["attributions"])
    assert saved["requirements"][0]["sourceExcerpt"] == (
        "Required: Terraform and Python experience."
    )
    assert any(row["id"] == opportunity_id and len(row["attributions"]) == 3
               for row in client.get("/opportunities").json())
    with factory() as session:
        assert session.get(Opportunity, UUID(opportunity_id)).source_text == SOURCE
        assert session.query(OpportunityAttribution).count() == 3


def test_repeat_approval_is_idempotent_and_stale_source_rejected(full_stack):
    client, opportunity_id, _, _ = full_stack
    preview = request_preview(client, opportunity_id).json()
    choice = selection(preview)
    path = f"/opportunities/{opportunity_id}/apply-reviewed-extraction"
    first = client.post(path, json=choice)
    assert first.status_code == 200
    second = client.post(path, json=choice)
    assert second.status_code == 200
    assert second.json()["changed"] is False
    assert second.json()["record"]["attributions"] == first.json()["record"]["attributions"]
    assert len(second.json()["record"]["requirements"]) == 1

    stale = {**choice, "sourceSha256": "f" * 64}
    response = client.post(path, json=stale)
    assert response.status_code == 409
    assert client.get(f"/opportunities/{opportunity_id}").json() == first.json()["record"]


def test_manual_edit_drops_outdated_citation_without_changing_source(full_stack):
    client, opportunity_id, _, _ = full_stack
    preview = request_preview(client, opportunity_id).json()
    path = f"/opportunities/{opportunity_id}"
    approved = client.post(f"{path}/apply-reviewed-extraction", json=selection(preview))
    assert approved.status_code == 200

    corrected = client.put(path, json={
        "title": "Manual job title", "company": "Owner corrected company", "location": "Toronto",
        "technologies": ["Manual Tool"],
    })
    assert corrected.status_code == 200, corrected.text
    saved = client.get(path).json()
    assert saved["sourceText"] == SOURCE
    assert saved["company"] == "Owner corrected company"
    assert set((a["field"], a["value"]) for a in saved["attributions"]) == {
        ("location", "Toronto"),
    }
    assert saved["requirements"][0]["sourceExcerpt"] == (
        "Required: Terraform and Python experience."
    )
