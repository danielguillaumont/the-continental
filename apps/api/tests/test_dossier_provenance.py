"""Slice 2D3A: permanent and non-misleading owner-reviewed source provenance."""

import hashlib
import importlib.util
import os
from pathlib import Path
from uuid import UUID

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest  # noqa: E402
from alembic.migration import MigrationContext  # noqa: E402
from alembic.operations import Operations  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, inspect, select  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Opportunity, OpportunityAttribution, Requirement  # noqa: E402

SOURCE = (
    "Cloud Security Engineer at Example Cloud.\n"
    "Required: Python and Terraform experience.\n"
    "Preferred: Kubernetes security.\n"
)
SHA = hashlib.sha256(SOURCE.encode("utf-8")).hexdigest()


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
            result = client.post("/opportunities", json={
                "sourceText": SOURCE, "title": "My manual role title",
                "technologies": ["Manual Tool"],
            })
            assert result.status_code == 201, result.text
            yield client, result.json()["id"], factory
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def approve(client, id_, metadata=None, technologies=None, requirements=None, sha=SHA):
    return client.post(f"/opportunities/{id_}/apply-reviewed-extraction", json={
        "confirmApply": True, "sourceSha256": sha,
        "metadata": metadata or [], "technologies": technologies or [],
        "requirements": requirements or [],
    })


def meta(field, value, excerpt):
    return {"field": field, "value": value, "sourceExcerpt": excerpt}


def tech(value, excerpt):
    return {"value": value, "sourceExcerpt": excerpt}


def req(text, kind, excerpt):
    return {"text": text, "kind": kind, "sourceExcerpt": excerpt}


def test_reviewed_values_and_excerpts_survive_reload(context):
    client, id_, factory = context
    result = approve(client, id_,
        metadata=[meta("company", "Example Cloud", "Example Cloud")],
        technologies=[tech("Python", "Python"), tech("Terraform", "Terraform")],
        requirements=[req("Kubernetes security", "preferred", "Preferred: Kubernetes security.")],
    )
    assert result.status_code == 200, result.text
    body = result.json()
    assert body["changed"] is True
    assert body["record"]["title"] == "My manual role title"
    assert body["record"]["extractionStatus"] == "not_run"
    assert body["record"]["extractionModel"] is None
    citations = body["record"]["attributions"]
    assert len(citations) == 3
    assert all(UUID(item["id"]) and item["sourceSha256"] == SHA for item in citations)
    assert {(item["kind"], item["field"], item["value"], item["sourceExcerpt"])
            for item in citations} == {
        ("metadata", "company", "Example Cloud", "Example Cloud"),
        ("technology", "technologies", "Python", "Python"),
        ("technology", "technologies", "Terraform", "Terraform"),
    }
    reread = client.get(f"/opportunities/{id_}")
    assert reread.status_code == 200
    assert reread.json()["attributions"] == citations
    listed = client.get("/opportunities").json()
    assert listed[0]["attributions"] == citations
    assert listed[0]["requirements"][0]["sourceExcerpt"] == "Preferred: Kubernetes security."
    with factory() as session:
        assert session.query(OpportunityAttribution).count() == 3
        assert session.query(Requirement).count() == 1


def test_skipped_manual_fields_and_preexisting_technology_get_no_false_citation(context):
    client, id_, _ = context
    result = approve(client, id_,
        metadata=[meta("title", "Cloud Security Engineer", "Cloud Security Engineer")],
        technologies=[tech("Manual Tool", "Python")],
    )
    # Technology is not in its excerpt, rejected; cannot attribute manual label.
    assert result.status_code == 422
    assert client.get(f"/opportunities/{id_}").json()["attributions"] == []
    result = approve(client, id_, metadata=[meta(
        "title", "Cloud Security Engineer", "Cloud Security Engineer"
    )])
    assert result.status_code == 200
    assert result.json()["skippedMetadata"] == ["title"]
    assert result.json()["record"]["attributions"] == []


def test_repeat_approval_does_not_add_more_citations(context):
    client, id_, factory = context
    request = dict(
        metadata=[meta("company", "Example Cloud", "Example Cloud")],
        technologies=[tech("Python", "Python")],
    )
    first = approve(client, id_, **request)
    assert first.status_code == 200, first.text
    old_ids = [item["id"] for item in first.json()["record"]["attributions"]]
    second = approve(client, id_, **request)
    assert second.status_code == 200, second.text
    assert second.json()["changed"] is False
    assert [item["id"] for item in second.json()["record"]["attributions"]] == old_ids
    with factory() as session:
        assert session.query(OpportunityAttribution).count() == 2


def test_manual_edits_drop_only_stale_citations(context):
    client, id_, _ = context
    assert approve(client, id_,
        metadata=[meta("company", "Example Cloud", "Example Cloud")],
        technologies=[tech("Python", "Python"), tech("Terraform", "Terraform")],
    ).status_code == 200
    # Entire PUT follows current manual form behavior; changing one metadata
    # value and removing one technology must not leave misleading citations.
    changed = client.put(f"/opportunities/{id_}", json={
        "title": "My manual role title", "company": "Owner corrected company",
        "technologies": ["Manual Tool", "Terraform"],
    })
    assert changed.status_code == 200, changed.text
    record = changed.json()
    assert record["sourceText"] == SOURCE
    assert record["company"] == "Owner corrected company"
    assert record["technologies"] == ["Manual Tool", "Terraform"]
    assert [(item["kind"], item["value"]) for item in record["attributions"]] == [
        ("technology", "Terraform"),
    ]
    assert client.get(f"/opportunities/{id_}").json()["attributions"] == record["attributions"]


def test_metadata_value_must_be_supported_by_actual_excerpt(context):
    client, id_, _ = context
    before = client.get(f"/opportunities/{id_}").json()
    # A malicious caller bypassing UI validation cannot cite a true source
    # excerpt for a fabricated metadata value.
    result = approve(client, id_, metadata=[meta(
        "company", "Invented Employer", "Example Cloud"
    )])
    assert result.status_code == 422
    assert client.get(f"/opportunities/{id_}").json() == before


def test_invalid_source_excerpt_keeps_data_and_citations_unchanged(context):
    client, id_, _ = context
    before = client.get(f"/opportunities/{id_}").json()
    result = approve(client, id_,
        metadata=[meta("company", "Example Cloud", "Example Cloud")],
        technologies=[tech("Kubernetes", "Made up excerpt")],
    )
    assert result.status_code == 422
    assert client.get(f"/opportunities/{id_}").json() == before


def test_stale_hash_keeps_data_and_citations_unchanged(context):
    client, id_, _ = context
    before = client.get(f"/opportunities/{id_}").json()
    result = approve(client, id_,
        metadata=[meta("company", "Example Cloud", "Example Cloud")],
        sha="0" * 64,
    )
    assert result.status_code == 409
    assert client.get(f"/opportunities/{id_}").json() == before


def test_delete_opportunity_cascades_attribution_and_keeps_other_records(context):
    client, id_, factory = context
    another = client.post("/opportunities", json={"sourceText": SOURCE}).json()["id"]
    assert approve(client, id_, technologies=[tech("Python", "Python")]).status_code == 200
    assert client.delete(f"/opportunities/{id_}").status_code == 204
    with factory() as session:
        assert session.query(OpportunityAttribution).count() == 0
        assert session.get(Opportunity, UUID(another)) is not None


def test_additive_provenance_migration_preserves_existing_opportunities():
    engine = create_engine("sqlite+pysqlite:///:memory:", poolclass=StaticPool)
    old = [table for table in Base.metadata.sorted_tables
           if table.name != "opportunity_attributions"]
    Base.metadata.create_all(engine, tables=old)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory.begin() as session:
        session.add(Opportunity(source_text=SOURCE, title="Earlier saved opportunity", technologies=[]))
    # Select only columns before the new attribution table exists: loading the
    # relationship would correctly fail until the migration is applied.
    with factory() as session:
        original = session.execute(select(Opportunity.id, Opportunity.source_text)).one()
        existing_id = original.id
        original_source = original.source_text
    migration_path = (
        Path(__file__).resolve().parents[1] / "migrations" / "versions" /
        "d39b2a4f7c61_add_opportunity_attributions.py"
    )
    spec = importlib.util.spec_from_file_location("provenance_migration_under_test", migration_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.down_revision == "e42d1c8b90a7"
    with engine.begin() as connection:
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        tables = set(inspect(connection).get_table_names())
        assert {"opportunities", "requirements", "opportunity_attributions"}.issubset(tables)
        fk = inspect(connection).get_foreign_keys("opportunity_attributions")
        assert any(item["referred_table"] == "opportunities" for item in fk)
    with factory() as session:
        record = session.get(Opportunity, existing_id)
        assert record is not None
        assert record.source_text == original_source
        assert session.query(OpportunityAttribution).count() == 0
    engine.dispose()
