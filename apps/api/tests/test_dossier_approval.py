"""Slice 2D1: reviewed selections are applied safely, atomically and idempotently."""

import hashlib
import os
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402

SOURCE = (
    "Cloud Security Engineer - Example Cloud\n"
    "Location: Toronto.\n"
    "Required: Python and Terraform experience.\n"
    "Preferred: Kubernetes security.\n"
    "Salary: CAD $100,000 - $120,000.\n"
)


@pytest.fixture
def context():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override():
        with factory() as session:
            yield session

    app.dependency_overrides[get_database_session] = override
    try:
        with TestClient(app) as client:
            create = client.post("/opportunities", json={
                "sourceText": SOURCE, "title": "My manually edited title",
                "company": None, "technologies": ["Manual Framework"],
            })
            assert create.status_code == 201, create.text
            record_id = create.json()["id"]
            existing = client.post(f"/opportunities/{record_id}/requirements", json={
                "text": "Python experience", "kind": "required",
                "sourceExcerpt": "Required: Python and Terraform experience.",
            })
            assert existing.status_code == 201, existing.text
            yield client, record_id, factory
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def data(**overrides):
    payload = {
        "confirmApply": True,
        "sourceSha256": hashlib.sha256(SOURCE.encode("utf-8")).hexdigest(),
        "metadata": [], "technologies": [], "requirements": [],
    }
    payload.update(overrides)
    return payload


def metadata(name, value, excerpt):
    return {"field": name, "value": value, "sourceExcerpt": excerpt}


def technology(value, excerpt):
    return {"value": value, "sourceExcerpt": excerpt}


def requirement(text, kind, excerpt):
    return {"text": text, "kind": kind, "sourceExcerpt": excerpt}


def apply(client, record_id, payload):
    return client.post(f"/opportunities/{record_id}/apply-reviewed-extraction", json=payload)


def test_selective_fill_never_overwrites_owner_fields(context):
    client, record_id, _ = context
    result = apply(client, record_id, data(metadata=[
        metadata("title", "Cloud Security Engineer", "Cloud Security Engineer"),
        metadata("company", "Example Cloud", "Example Cloud"),
    ]))
    assert result.status_code == 200, result.text
    body = result.json()
    assert body["appliedMetadata"] == ["company"]
    assert body["skippedMetadata"] == ["title"]
    assert body["record"]["title"] == "My manually edited title"
    assert body["record"]["company"] == "Example Cloud"
    assert body["changed"] is True
    assert body["record"]["sourceText"] == SOURCE
    assert body["record"]["extractionStatus"] == "not_run"
    assert body["record"]["extractionModel"] is None


def test_add_reviewed_technologies_without_duplicates(context):
    client, record_id, _ = context
    body = data(technologies=[technology("Python", "Python"), technology("python", "Python"),
                              technology("Terraform", "Terraform")])
    result = apply(client, record_id, body)
    assert result.status_code == 200
    assert result.json()["addedTechnologies"] == ["Python", "Terraform"]
    assert result.json()["skippedTechnologies"] == ["python"]
    assert result.json()["record"]["technologies"] == ["Manual Framework", "Python", "Terraform"]
    again = apply(client, record_id, body)
    assert again.status_code == 200
    assert again.json()["changed"] is False
    assert again.json()["skippedTechnologies"] == ["Python", "python", "Terraform"]


def test_requirements_have_stable_ids_excerpts_and_positions(context):
    client, record_id, _ = context
    response = apply(client, record_id, data(requirements=[
        requirement(" Terraform experience ", "required", "Required: Python and Terraform experience."),
        requirement("Kubernetes security", "preferred", "Preferred: Kubernetes security."),
    ]))
    assert response.status_code == 200, response.text
    assert response.json()["addedRequirements"] == 2
    rows = response.json()["record"]["requirements"]
    assert len(rows) == 3
    assert {row["position"] for row in rows} == {0, 1, 2}
    assert len({row["id"] for row in rows}) == 3
    assert rows[-1]["sourceExcerpt"] == "Preferred: Kubernetes security."
    again = apply(client, record_id, data(requirements=[
        requirement("  terraform   EXPERIENCE", "required", "Required: Python and Terraform experience."),
        requirement("Kubernetes security", "preferred", "Preferred: Kubernetes security."),
    ]))
    assert again.status_code == 200
    assert again.json()["addedRequirements"] == 0
    assert again.json()["skippedRequirements"] == 2
    assert [row["id"] for row in again.json()["record"]["requirements"]] == [row["id"] for row in rows]


def test_existing_owner_requirement_is_not_duplicated(context):
    client, record_id, _ = context
    reply = apply(client, record_id, data(requirements=[requirement(
        "PYTHON EXPERIENCE", "required", "Required: Python and Terraform experience."
    )]))
    assert reply.status_code == 200
    assert reply.json()["skippedRequirements"] == 1
    assert reply.json()["addedRequirements"] == 0
    assert len(reply.json()["record"]["requirements"]) == 1


def test_stale_source_hash_is_rejected_without_mutation(context):
    client, record_id, _ = context
    before = client.get(f"/opportunities/{record_id}").json()
    response = apply(client, record_id, data(
        sourceSha256="0" * 64,
        metadata=[metadata("company", "Example Cloud", "Example Cloud")]
    ))
    assert response.status_code == 409
    assert client.get(f"/opportunities/{record_id}").json() == before


def test_unknown_or_fabricated_excerpt_rolls_back_entire_selection(context):
    client, record_id, _ = context
    before = client.get(f"/opportunities/{record_id}").json()
    response = apply(client, record_id, data(
        metadata=[metadata("company", "Example Cloud", "Example Cloud")],
        requirements=[requirement("Imaginary certification", "required", "Certified by imaginary authority")]
    ))
    assert response.status_code == 422
    assert client.get(f"/opportunities/{record_id}").json() == before


@pytest.mark.parametrize("override", [
    {"confirmApply": False},
    {"confirmApply": None},
    {"sourceSha256": "not-a-hash"},
    {"unexpected": "extra"},
    {"metadata": []},
])
def test_invalid_confirmation_hash_or_empty_selection(context, override):
    client, record_id, _ = context
    request = data(metadata=[metadata("company", "Example Cloud", "Example Cloud")])
    if override == {"metadata": []}:
        request["metadata"] = []
    else:
        request.update(override)
    assert apply(client, record_id, request).status_code == 422


def test_duplicate_metadata_field_rejected_without_write(context):
    client, record_id, _ = context
    response = apply(client, record_id, data(metadata=[
        metadata("company", "Example Cloud", "Example Cloud"),
        metadata("company", "Another", "Example Cloud"),
    ]))
    assert response.status_code == 422
    assert client.get(f"/opportunities/{record_id}").json()["company"] is None


def test_bad_field_bounds_and_unsupported_field_rejected(context):
    client, record_id, _ = context
    for item in [metadata("sourceText", "bad", "Python"),
                 metadata("company", "x" * 161, "Example Cloud"),
                 metadata("salaryText", " ", "Salary")]:
        assert apply(client, record_id, data(metadata=[item])).status_code == 422


def test_requirements_and_technologies_must_have_valid_excerpts(context):
    client, record_id, _ = context
    assert apply(client, record_id, data(technologies=[technology("Ruby", "Python")])).status_code == 422
    assert apply(client, record_id, data(requirements=[
        requirement("Ruby", "mandatory", "Python")
    ])).status_code == 422


def test_missing_opportunity_is_not_created(context):
    client, _, _ = context
    result = apply(client, str(uuid4()), data(metadata=[metadata("company", "Example Cloud", "Example Cloud")]))
    assert result.status_code == 404


def test_source_is_not_writable_via_review_contract(context):
    client, record_id, _ = context
    before = client.get(f"/opportunities/{record_id}").json()
    response = apply(client, record_id, data(
        metadata=[metadata("company", "Example Cloud", "Example Cloud")],
        sourceText="replaced",
    ))
    assert response.status_code == 422
    assert client.get(f"/opportunities/{record_id}").json() == before
