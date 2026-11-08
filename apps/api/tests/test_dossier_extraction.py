"""Dossier 2C1: no external calls during tests, no database mutations on previews."""

import hashlib
import io
import json
import os
from uuid import UUID, uuid4
from urllib.error import HTTPError

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.dossier_extraction as extraction  # noqa: E402
from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Opportunity  # noqa: E402

SOURCE = (
    "Senior Platform Engineer - Example Systems\n"
    "Location: Toronto, ON (Remote)\n"
    "Required: Python and Terraform experience.\n"
    "Preferred: Kubernetes security experience.\n"
)


def grounded(value=None, excerpt=None):
    return {"value": value, "sourceExcerpt": excerpt}


def valid_draft():
    return {
        "title": grounded("Senior Platform Engineer", "Senior Platform Engineer"),
        "company": grounded("Example Systems", "Example Systems"),
        "location": grounded("Toronto, ON", "Toronto, ON"),
        "employmentType": grounded(),
        "salaryText": grounded(),
        "technologies": [
            {"value": "Python", "sourceExcerpt": "Python"},
            {"value": "Terraform", "sourceExcerpt": "Terraform"},
        ],
        "requirements": [
            {"text": "Experience with Python and Terraform", "kind": "required",
             "sourceExcerpt": "Required: Python and Terraform experience."},
            {"text": "Kubernetes security experience", "kind": "preferred",
             "sourceExcerpt": "Preferred: Kubernetes security experience."},
        ],
    }


class StubExtractor:
    provider = "openai"
    model = "offline-contract-test"

    def __init__(self, draft=None, error=None):
        self.draft = draft if draft is not None else valid_draft()
        self.error = error
        self.calls = []

    def extract(self, source_text):
        self.calls.append(source_text)
        if self.error:
            raise self.error
        return self.draft


@pytest.fixture
def context():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def session_override():
        with factory() as session:
            yield session

    stub = StubExtractor()
    app.dependency_overrides[get_database_session] = session_override
    app.dependency_overrides[extraction.get_extractor] = lambda: stub
    try:
        with TestClient(app) as client:
            created = client.post("/opportunities", json={
                "sourceText": SOURCE, "title": "Owner-edited title",
                "company": "Owner Company", "technologies": ["Manual Tool"]
            })
            assert created.status_code == 201, created.text
            opportunity_id = created.json()["id"]
            requirement = client.post(
                f"/opportunities/{opportunity_id}/requirements",
                json={"text": "Manual requirement", "kind": "preferred",
                      "sourceExcerpt": "Terraform"},
            )
            assert requirement.status_code == 201, requirement.text
            yield client, factory, opportunity_id, stub
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def post_preview(client, record_id, body=None):
    if body is None:
        body = {"confirmExternalProcessing": True}
    return client.post(f"/opportunities/{record_id}/extraction-preview", json=body)


def test_preview_requires_explicit_consent_and_never_mutates_records(context):
    client, factory, opportunity_id, stub = context
    before = client.get(f"/opportunities/{opportunity_id}").json()

    denied = post_preview(client, opportunity_id, {"confirmExternalProcessing": False})
    assert denied.status_code == 422
    missing = client.post(f"/opportunities/{opportunity_id}/extraction-preview", json={})
    assert missing.status_code == 422
    assert stub.calls == []

    preview = post_preview(client, opportunity_id)
    assert preview.status_code == 200, preview.text
    value = preview.json()
    assert value["opportunityId"] == opportunity_id
    assert value["sourceSha256"] == hashlib.sha256(SOURCE.encode()).hexdigest()
    assert value["provider"] == "openai"
    assert value["model"] == "offline-contract-test"
    assert value["promptVersion"] == extraction.PROMPT_VERSION
    assert value["saved"] is False
    assert value["reviewRequired"] is True
    assert len(value["draft"]["requirements"]) == 2
    assert value["draft"]["company"]["value"] == "Example Systems"
    assert stub.calls == [SOURCE]

    after = client.get(f"/opportunities/{opportunity_id}").json()
    assert after == before, "Preview cannot update title, requirements, or status."
    with factory() as session:
        assert session.get(Opportunity, UUID(before["id"])).extraction_status == "not_run"


def test_missing_opportunity_returns_404_with_enabled_stub(context):
    client, _, _, stub = context
    result = post_preview(client, str(uuid4()))
    assert result.status_code == 404
    assert stub.calls == []


@pytest.mark.parametrize("change", [
    lambda d: d["requirements"][0].update(sourceExcerpt="imaginary qualification"),
    lambda d: d["company"].update(sourceExcerpt="Invented LLC"),
    lambda d: d["location"].update(sourceExcerpt=None),
    lambda d: d["technologies"][0].update(value="Rust"),
    lambda d: d.update(requirements=d["requirements"] * 41),
    lambda d: d.update(unexpected="untrusted"),
    lambda d: d["requirements"][1].update(kind="essential"),
])
def test_invalid_or_ungrounded_output_is_rejected_without_writes(context, change):
    client, _, id_, stub = context
    before = client.get(f"/opportunities/{id_}").json()
    draft = valid_draft()
    change(draft)
    stub.draft = draft
    response = post_preview(client, id_)
    assert response.status_code == 502, response.text
    assert "source" not in response.text.lower() or "schema" in response.text.lower()
    assert client.get(f"/opportunities/{id_}").json() == before


def test_provider_failure_has_no_side_effects(context):
    client, _, id_, stub = context
    before = client.get(f"/opportunities/{id_}").json()
    stub.error = extraction.ExtractionFailure("Model declined extraction; nothing was saved.")
    response = post_preview(client, id_)
    assert response.status_code == 502
    assert "nothing was saved" in response.text
    assert client.get(f"/opportunities/{id_}").json() == before


def test_oversize_posting_rejected_without_provider_call(context):
    client, _, _, stub = context
    created = client.post("/opportunities", json={"sourceText": "A" * 30_001})
    assert created.status_code == 201
    result = post_preview(client, created.json()["id"])
    assert result.status_code == 413
    assert stub.calls == []


def test_disabled_configuration_and_missing_credentials_return_503(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("CONTINENTAL_EXTRACTION_MODEL", raising=False)
    monkeypatch.delenv("CONTINENTAL_EXTRACTION_PROVIDER", raising=False)
    with pytest.raises(Exception) as exc:
        extraction.get_extractor()
    assert getattr(exc.value, "status_code") == 503
    monkeypatch.setenv("CONTINENTAL_EXTRACTION_PROVIDER", "openai")
    with pytest.raises(Exception) as exc:
        extraction.get_extractor()
    assert getattr(exc.value, "status_code") == 503
    monkeypatch.setenv("OPENAI_API_KEY", "local-test-key")
    monkeypatch.setenv("CONTINENTAL_EXTRACTION_MODEL", "chosen-model")
    provider = extraction.get_extractor()
    assert provider.provider == "openai"
    assert provider.model == "chosen-model"


def test_provider_sends_strict_schema_without_storing_and_parses_output(monkeypatch):
    sent = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return None

        def read(self, *a, **k):
            return json.dumps({
                "status": "completed",
                "output": [{"type": "message", "content": [
                    {"type": "output_text", "text": json.dumps(valid_draft())}
                ]}],
            }).encode()

    def fake_urlopen(request, timeout):
        assert timeout == extraction.MODEL_TIMEOUT_SECONDS
        sent["headers"] = request.headers
        sent["payload"] = json.loads(request.data)
        return FakeResponse()

    monkeypatch.setattr(extraction, "urlopen", fake_urlopen)
    provider = extraction.OpenAIExtractor(api_key="secret-for-test", model="test-model")
    assert provider.extract(SOURCE) == valid_draft()
    assert sent["payload"]["store"] is False
    assert sent["payload"]["text"]["format"]["strict"] is True
    assert sent["payload"]["text"]["format"]["schema"] == extraction.EXTRACTION_JSON_SCHEMA
    assert sent["payload"]["input"][0]["content"] == SOURCE
    assert sent["headers"]["Authorization"] == "Bearer secret-for-test"


def test_provider_http_error_never_reflects_source_or_key(monkeypatch):
    def fake_urlopen(*args, **kwargs):
        raise HTTPError(
            extraction.EXTRACTION_URL, 429, "Posting with secret-for-test", {},
            io.BytesIO(b"secret-for-test and private job content"),
        )
    monkeypatch.setattr(extraction, "urlopen", fake_urlopen)
    provider = extraction.OpenAIExtractor(api_key="secret-for-test", model="model")
    with pytest.raises(extraction.ExtractionFailure) as exc:
        provider.extract(SOURCE)
    assert "secret-for-test" not in str(exc.value)
    assert SOURCE not in str(exc.value)
    assert "429" in str(exc.value)


def test_provider_refusal_and_incomplete_are_rejected(monkeypatch):
    class FakeResponse:
        def __init__(self, payload):
            self.payload = payload

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return None

        def read(self, *args, **kwargs):
            return json.dumps(self.payload).encode()

    provider = extraction.OpenAIExtractor(api_key="test-key", model="model")
    for payload in (
        {"status": "incomplete", "output": []},
        {"status": "completed", "output": [{"type": "message", "content": [
            {"type": "refusal", "refusal": "No thanks"}
        ]}]},
    ):
        monkeypatch.setattr(extraction, "urlopen", lambda *a, **k: FakeResponse(payload))
        with pytest.raises(extraction.ExtractionFailure):
            provider.extract(SOURCE)


def test_strict_json_schema_is_closed_and_every_field_required():
    def verify(node):
        if not isinstance(node, dict):
            return
        if node.get("type") == "object":
            assert node["additionalProperties"] is False
            assert set(node["required"]) == set(node["properties"])
        for value in node.values():
            if isinstance(value, dict):
                verify(value)
            elif isinstance(value, list):
                for v in value:
                    verify(v)
    verify(extraction.EXTRACTION_JSON_SCHEMA)
