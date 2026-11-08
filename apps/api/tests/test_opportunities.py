"""Dossier Slice 2A: disposable API tests and actual additive migration."""

import importlib.util
import os
from pathlib import Path
from datetime import date
from uuid import UUID, uuid4

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
from app.models import (  # noqa: E402
    Certification, Evidence, Experience, Opportunity, Profile, Project,
    Requirement, Skill,
)


SOURCE = (
    "Platform Engineer - Example Systems\n"
    "Required: Python, Terraform, and production Linux administration.\n"
    "Preferred: Kubernetes security experience.\n"
    "This posting contains no salary information.\n"
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
            yield client, factory
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def opportunity(**changes):
    return {
        "sourceText": SOURCE,
        "title": "Platform Engineer",
        "company": "Example Systems",
        "location": "  Toronto, ON  ",
        "employmentType": "Full-time",
        "salaryText": None,
        "sourceUrl": "https://example.org/careers/platform",
        "technologies": ["Python", "Terraform", "python"],
        **changes,
    }


def requirement(**changes):
    return {
        "text": "Use Terraform for reliable infrastructure",
        "kind": "required",
        "sourceExcerpt": "Terraform",
        **changes,
    }


def test_create_read_list_update_delete_and_original_preserved(context):
    client, factory = context
    created = client.post("/opportunities", json=opportunity())
    assert created.status_code == 201, created.text
    original = created.json()
    UUID(original["id"])
    assert original["sourceText"] == SOURCE
    assert original["location"] == "Toronto, ON"
    assert original["salaryText"] is None
    assert original["technologies"] == ["Python", "Terraform"]
    assert original["extractionStatus"] == "not_run"
    assert original["extractionProvider"] is None
    assert original["extractionModel"] is None
    assert original["extractionPromptVersion"] is None
    assert original["requirements"] == []
    assert original["createdAt"] and original["updatedAt"]
    assert client.get(f"/opportunities/{original['id']}").json() == original
    assert len(client.get("/opportunities").json()) == 1

    update = client.put(
        f"/opportunities/{original['id']}",
        json={"title": "  Senior Platform Engineer ", "company": "Updated Inc",
              "technologies": [], "salaryText": " ", "sourceUrl": None},
    )
    assert update.status_code == 200, update.text
    after = update.json()
    assert after["title"] == "Senior Platform Engineer"
    assert after["sourceText"] == SOURCE
    assert after["company"] == "Updated Inc"
    assert after["salaryText"] is None
    assert after["location"] is None
    assert after["sourceUrl"] is None
    assert after["technologies"] == []
    assert after["createdAt"] == original["createdAt"]
    with factory() as session:
        assert session.get(Opportunity, UUID(original["id"])).source_text == SOURCE

    assert client.delete(f"/opportunities/{original['id']}").status_code == 204
    assert client.get(f"/opportunities/{original['id']}").status_code == 404
    assert client.get("/opportunities").json() == []


def test_minimal_raw_posting_keeps_all_unknown_fields_null(context):
    client, _ = context
    created = client.post("/opportunities", json={"sourceText": SOURCE})
    assert created.status_code == 201, created.text
    record = created.json()
    for key in (
        "title", "company", "location", "employmentType", "salaryText",
        "sourceUrl", "extractionModel", "extractionProvider", "extractionPromptVersion",
    ):
        assert record[key] is None
    assert record["technologies"] == []
    assert record["requirements"] == []
    assert record["extractionStatus"] == "not_run"


def test_source_cannot_be_overwritten_by_metadata_update(context):
    client, _ = context
    id_ = client.post("/opportunities", json=opportunity()).json()["id"]
    result = client.put(
        f"/opportunities/{id_}",
        json={"sourceText": "Fake replacement", "title": "Edited"},
    )
    assert result.status_code == 422
    assert client.get(f"/opportunities/{id_}").json()["sourceText"] == SOURCE


def test_required_and_preferred_requirements_keep_stable_ids(context):
    client, factory = context
    id_ = client.post("/opportunities", json=opportunity()).json()["id"]
    first = client.post(f"/opportunities/{id_}/requirements", json=requirement())
    second = client.post(
        f"/opportunities/{id_}/requirements",
        json=requirement(
            text="Experience with Kubernetes security",
            kind="preferred", sourceExcerpt="Kubernetes security experience",
        ),
    )
    assert first.status_code == 201, first.text
    assert second.status_code == 201, second.text
    assert first.json()["position"] == 0
    assert second.json()["position"] == 1
    first_id = first.json()["id"]
    second_id = second.json()["id"]

    edited = client.put(
        f"/opportunities/{id_}/requirements/{first_id}",
        json=requirement(
            text="Verified corrected qualification", kind="preferred",
            sourceExcerpt="Required: Python",
        ),
    )
    assert edited.status_code == 200, edited.text
    assert edited.json()["id"] == first_id
    assert edited.json()["kind"] == "preferred"
    assert edited.json()["sourceExcerpt"] == "Required: Python"
    assert edited.json()["createdAt"] == first.json()["createdAt"]
    stored = client.get(f"/opportunities/{id_}").json()["requirements"]
    assert [item["id"] for item in stored] == [first_id, second_id]
    assert stored[0]["text"] == "Verified corrected qualification"
    with factory() as session:
        assert len(session.scalars(select(Requirement)).all()) == 2

    assert client.delete(f"/opportunities/{id_}/requirements/{first_id}").status_code == 204
    assert client.delete(f"/opportunities/{id_}/requirements/{first_id}").status_code == 404
    assert client.get(f"/opportunities/{id_}").json()["requirements"][0]["id"] == second_id
    next_ = client.post(f"/opportunities/{id_}/requirements", json=requirement())
    assert next_.status_code == 201
    assert next_.json()["position"] == 2


def test_excerpt_must_be_real_source_text(context):
    client, factory = context
    id_ = client.post("/opportunities", json=opportunity()).json()["id"]
    bad = client.post(
        f"/opportunities/{id_}/requirements",
        json=requirement(sourceExcerpt="Rust expertise that posting never mentions"),
    )
    assert bad.status_code == 422
    assert "exact substring" in bad.json()["detail"]
    assert client.get(f"/opportunities/{id_}").json()["requirements"] == []
    valid = client.post(
        f"/opportunities/{id_}/requirements",
        json=requirement(sourceExcerpt=None),
    )
    assert valid.status_code == 201
    item_id = valid.json()["id"]
    assert client.put(
        f"/opportunities/{id_}/requirements/{item_id}",
        json=requirement(sourceExcerpt="unquoted claim"),
    ).status_code == 422
    with factory() as session:
        assert session.get(Requirement, UUID(item_id)).source_excerpt is None


def test_requirement_isolation_and_cascading_delete(context):
    client, factory = context
    one = client.post("/opportunities", json=opportunity()).json()["id"]
    two = client.post("/opportunities", json=opportunity(title="Another role")).json()["id"]
    req = client.post(f"/opportunities/{one}/requirements", json=requirement()).json()["id"]
    assert client.put(f"/opportunities/{two}/requirements/{req}", json=requirement()).status_code == 404
    assert client.delete(f"/opportunities/{two}/requirements/{req}").status_code == 404
    assert client.get(f"/opportunities/{two}").json()["requirements"] == []
    assert client.get(f"/opportunities/{one}").json()["requirements"][0]["id"] == req
    assert client.delete(f"/opportunities/{one}").status_code == 204
    with factory() as session:
        assert session.get(Requirement, UUID(req)) is None
        assert session.get(Opportunity, UUID(two)) is not None


def test_bad_fields_respond_422_without_writes(context):
    client, _ = context
    bad = [
        {"sourceText": ""},
        {"sourceText": " ", "title": "invalid"},
        {"sourceText": "too short"},
        opportunity(sourceUrl="file:///etc/passwd"),
        opportunity(sourceUrl="https://user:secret@example.org/"),
        opportunity(company="C" * 161),
        opportunity(title="X" * 201),
        opportunity(technologies=["  "]),
        opportunity(technologies=["Z" * 101]),
        opportunity(technologies=list(map(str, range(41)))),
        opportunity(unknownField="surprise"),
    ]
    for payload in bad:
        result = client.post("/opportunities", json=payload)
        assert result.status_code == 422, (payload, result.text)
    assert client.get("/opportunities").json() == []


def test_requirement_validation_and_missing_parent(context):
    client, _ = context
    id_ = client.post("/opportunities", json=opportunity()).json()["id"]
    bad_requirements = [
        requirement(kind="mandatory"),
        requirement(kind="required", text=" "),
        requirement(text="x"),
        requirement(text="x" * 2001),
        requirement(sourceExcerpt="x" * 2001),
        requirement(unknownKey="ignored?"),
    ]
    for payload in bad_requirements:
        response = client.post(f"/opportunities/{id_}/requirements", json=payload)
        assert response.status_code == 422, (payload, response.text)
    assert client.get(f"/opportunities/{id_}").json()["requirements"] == []
    missing = str(uuid4())
    assert client.get(f"/opportunities/{missing}").status_code == 404
    assert client.put(f"/opportunities/{missing}", json={}).status_code == 404
    assert client.delete(f"/opportunities/{missing}").status_code == 404
    assert client.post(f"/opportunities/{missing}/requirements", json=requirement()).status_code == 404
    assert client.get("/opportunities/nope").status_code == 422


def test_opportunities_do_not_modify_v01_career_records(context):
    client, factory = context
    project = client.post("/projects", json={
        "name": "Existing project", "summary": "Previously saved project", "status": "active",
    })
    evidence = client.post("/evidence", json={
        "kind": "project", "title": "Existing proof", "description": "Original stored documentation",
        "status": "verified", "skills": ["Linux"],
    })
    assert project.status_code == evidence.status_code == 201
    with factory() as session:
        before = {
            "projects": session.query(Project).count(),
            "evidence": session.query(Evidence).count(),
            "skills": session.query(Skill).count(),
            "experiences": session.query(Experience).count(),
            "certifications": session.query(Certification).count(),
            "profiles": session.query(Profile).count(),
        }
    id_ = client.post("/opportunities", json=opportunity()).json()["id"]
    assert client.post(f"/opportunities/{id_}/requirements", json=requirement()).status_code == 201
    with factory() as session:
        assert before == {
            "projects": session.query(Project).count(),
            "evidence": session.query(Evidence).count(),
            "skills": session.query(Skill).count(),
            "experiences": session.query(Experience).count(),
            "certifications": session.query(Certification).count(),
            "profiles": session.query(Profile).count(),
        }
    assert client.get(f"/projects/{project.json()['id']}").status_code == 200
    assert client.get(f"/evidence/{evidence.json()['id']}").status_code == 200


def test_additive_migration_keeps_all_prior_tables_and_rows():
    engine = create_engine("sqlite+pysqlite:///:memory:", poolclass=StaticPool)
    old = [
        table for table in Base.metadata.sorted_tables
        if table.name not in {"opportunities", "requirements"}
    ]
    Base.metadata.create_all(engine, tables=old)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory.begin() as session:
        session.add(Project(name="Original project", summary="Kept", status="active"))
        session.add(Evidence(kind="artifact", title="Original evidence", description="Kept", status="verified"))
        session.add(Skill(name="Python", normalized_name="python"))
        session.add(Experience(
            organization="Original employer", title="Engineer", start_date=date(2025, 1, 1),
            description="Kept", highlights=[],
        ))
        session.add(Certification(name="Original credential", issuer="Original issuer"))
        session.add(Profile(id=1, full_name="Original owner", target_roles=[]))
    migration_path = (
        Path(__file__).resolve().parents[1] / "migrations" / "versions" /
        "e42d1c8b90a7_add_opportunities_and_requirements.py"
    )
    spec = importlib.util.spec_from_file_location("opportunity_migration_under_test", migration_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.down_revision == "b7c2e49a1d03"
    with engine.begin() as connection:
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        tables = set(inspect(connection).get_table_names())
        assert {"opportunities", "requirements"}.issubset(tables)
        assert all(table.name in tables for table in old)
        requirements_fks = inspect(connection).get_foreign_keys("requirements")
        assert any(fk["referred_table"] == "opportunities" for fk in requirements_fks)
    with factory() as session:
        assert session.scalar(select(Project)).name == "Original project"
        assert session.scalar(select(Evidence)).title == "Original evidence"
        assert session.scalar(select(Skill)).name == "Python"
        assert session.scalar(select(Experience)).title == "Engineer"
        assert session.scalar(select(Certification)).name == "Original credential"
        assert session.scalar(select(Profile)).full_name == "Original owner"
        assert session.scalars(select(Opportunity)).all() == []
        assert session.scalars(select(Requirement)).all() == []
    engine.dispose()
