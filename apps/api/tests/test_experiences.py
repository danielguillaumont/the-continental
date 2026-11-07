"""Disposable SQLite integration tests; never connect to local PostgreSQL."""

import os
from uuid import UUID, uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, inspect, select  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    Evidence,
    Experience,
    Project,
    Skill,
    evidence_skills,
    experience_evidence,
    experience_projects,
    project_evidence,
)


@pytest.fixture
def context():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
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


def experience(**changes):
    return {
        "organization": "Northwind Security",
        "title": "Cloud Analyst",
        "employmentType": "internship",
        "location": "Remote",
        "startDate": "2025-05-01",
        "endDate": "2025-08-31",
        "description": "Investigated cloud configuration issues and drafted reports.",
        "highlights": ["Automated repeated status checks with a small script"],
        **changes,
    }


def project():
    return {
        "name": "Security console",
        "summary": "A project built to investigate and document security controls.",
        "status": "completed",
    }


def evidence():
    return {
        "kind": "artifact", "title": "Test report",
        "description": "A repeatable test report showing the actual output.",
        "skills": ["Python"], "status": "verified",
    }


def test_experience_create_list_read_update_delete(context):
    client, _ = context
    initial = client.post("/experiences", json=experience())
    assert initial.status_code == 201, initial.text
    item = initial.json()
    UUID(item["id"])
    assert item["projects"] == item["evidence"] == []
    assert item["employmentType"] == "internship"
    assert item["highlights"] == experience()["highlights"]
    assert item["createdAt"] and item["updatedAt"]
    assert client.get("/experiences").json()[0]["id"] == item["id"]
    assert client.get(f"/experiences/{item['id']}").json()["organization"] == "Northwind Security"

    updated = client.put(
        f"/experiences/{item['id']}",
        json=experience(title="Senior Cloud Analyst", endDate=None,
                        highlights=["Documented successful checks"]),
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["title"] == "Senior Cloud Analyst"
    assert updated.json()["endDate"] is None
    assert updated.json()["highlights"] == ["Documented successful checks"]
    assert client.delete(f"/experiences/{item['id']}").status_code == 204
    assert client.get(f"/experiences/{item['id']}").status_code == 404
    assert client.get("/experiences").json() == []


def test_input_validation_dates_fields_and_highlights(context):
    client, _ = context
    invalid = [
        experience(endDate="2025-01-01"),
        experience(startDate="not-a-date"),
        experience(organization="   "),
        experience(title=""),
        experience(description="short"),
        experience(description="         x"),
        experience(employmentType="invented"),
        experience(highlights=["a"]),
        experience(highlights=["Repeated result", " repeated RESULT "]),
        experience(highlights=["An accomplishment"] * 13),
    ]
    for payload in invalid:
        response = client.post("/experiences", json=payload)
        assert response.status_code == 422, (payload, response.text)
    assert client.get("/experiences").json() == []


def test_optional_values_normalize_and_current_role(context):
    client, _ = context
    created = client.post(
        "/experiences",
        json=experience(
            title="  Cloud Analyst  ", organization="  Example Corp  ",
            location="   ", employmentType=None, endDate=None,
            highlights=["  Automated recurring reports  "],
        ),
    )
    assert created.status_code == 201, created.text
    item = created.json()
    assert item["title"] == "Cloud Analyst"
    assert item["organization"] == "Example Corp"
    assert item["location"] is None
    assert item["endDate"] is None
    assert item["highlights"] == ["Automated recurring reports"]


def test_links_are_idempotent_and_sources_stay_independent(context):
    client, factory = context
    item_id = client.post("/experiences", json=experience()).json()["id"]
    project_id = client.post("/projects", json=project()).json()["id"]
    evidence_id = client.post("/evidence", json=evidence()).json()["id"]
    p_link = f"/experiences/{item_id}/projects/{project_id}"
    e_link = f"/experiences/{item_id}/evidence/{evidence_id}"
    for _ in range(2):
        assert len(client.post(p_link).json()["projects"]) == 1
        assert len(client.post(e_link).json()["evidence"]) == 1
    record = client.get(f"/experiences/{item_id}").json()
    assert record["projects"][0]["name"] == "Security console"
    assert record["evidence"][0]["title"] == "Test report"
    assert client.delete(p_link).json()["projects"] == []
    assert client.delete(e_link).json()["evidence"] == []
    assert client.delete(e_link).status_code == 404
    assert client.delete(p_link).status_code == 404

    assert client.post(p_link).status_code == 200
    assert client.post(e_link).status_code == 200
    assert client.delete(f"/experiences/{item_id}").status_code == 204
    assert client.get(f"/projects/{project_id}").status_code == 200
    assert client.get(f"/evidence/{evidence_id}").status_code == 200
    with factory() as session:
        assert session.get(Experience, UUID(item_id)) is None
        assert session.execute(select(experience_projects)).all() == []
        assert session.execute(select(experience_evidence)).all() == []


def test_deleting_linked_sources_preserves_experience(context):
    client, factory = context
    item_id = client.post("/experiences", json=experience()).json()["id"]
    project_id = client.post("/projects", json=project()).json()["id"]
    evidence_id = client.post("/evidence", json=evidence()).json()["id"]
    assert client.post(f"/experiences/{item_id}/projects/{project_id}").status_code == 200
    assert client.post(f"/experiences/{item_id}/evidence/{evidence_id}").status_code == 200
    assert client.delete(f"/projects/{project_id}").status_code == 204
    assert client.delete(f"/evidence/{evidence_id}").status_code == 204
    item = client.get(f"/experiences/{item_id}")
    assert item.status_code == 200, item.text
    assert item.json()["projects"] == item.json()["evidence"] == []
    with factory() as session:
        assert session.execute(select(experience_projects)).all() == []
        assert session.execute(select(experience_evidence)).all() == []


def test_missing_references_and_invalid_id(context):
    client, _ = context
    missing = str(uuid4())
    assert client.get(f"/experiences/{missing}").status_code == 404
    assert client.put(f"/experiences/{missing}", json=experience()).status_code == 404
    assert client.delete(f"/experiences/{missing}").status_code == 404
    assert client.get("/experiences/not-a-uuid").status_code == 422
    assert client.post(f"/experiences/{missing}/projects/{missing}").status_code == 404
    assert client.post(f"/experiences/{missing}/evidence/{missing}").status_code == 404

    item_id = client.post("/experiences", json=experience()).json()["id"]
    assert client.post(f"/experiences/{item_id}/projects/{missing}").status_code == 404
    assert client.post(f"/experiences/{item_id}/evidence/{missing}").status_code == 404
    assert client.delete(f"/experiences/{item_id}/projects/{missing}").status_code == 404
    assert client.delete(f"/experiences/{item_id}/evidence/{missing}").status_code == 404


def test_additive_migration_preserves_existing_data():
    """Execute the actual Alembic migration against the prior schema in SQLite."""
    import importlib.util
    from pathlib import Path
    from alembic.migration import MigrationContext
    from alembic.operations import Operations

    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    old_tables = [Skill.__table__, Evidence.__table__, evidence_skills,
                  Project.__table__, project_evidence]
    Base.metadata.create_all(engine, tables=old_tables)
    factory = sessionmaker(bind=engine)
    with factory.begin() as session:
        old_evidence = Evidence(
            kind="artifact", title="Original evidence",
            description="Saved before the experience registry existed.", status="verified",
        )
        old_project = Project(name="Original project", summary="A previously saved project.",
                              status="active")
        session.add_all([old_evidence, old_project])
        session.flush()
        old_evidence_id, old_project_id = old_evidence.id, old_project.id

    migration = (Path(__file__).resolve().parents[1] / "migrations" / "versions"
                 / "6b7e3a91c4d2_add_experiences_and_links.py")
    spec = importlib.util.spec_from_file_location("experience_migration_under_test", migration)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.down_revision == "8d2e7af4c9b1"
    with engine.begin() as connection:
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        assert {"experiences", "experience_projects", "experience_evidence"}.issubset(
            set(inspect(connection).get_table_names())
        )
        assert "evidence" in inspect(connection).get_table_names()
    with factory() as session:
        assert session.get(Evidence, old_evidence_id).title == "Original evidence"
        assert session.get(Project, old_project_id).name == "Original project"
        assert session.scalars(select(Experience)).all() == []
    engine.dispose()


def test_legacy_evidence_routes_remain_working(context):
    client, _ = context
    old = client.post("/evidence", json=evidence())
    assert old.status_code == 201
    assert len(client.get("/evidence").json()) == 1
    assert client.get(f"/evidence/{old.json()['id']}").status_code == 200


def test_experience_list_order_and_update_preserves_links(context):
    client, _ = context
    older_id = client.post(
        "/experiences", json=experience(startDate="2023-05-01", endDate="2023-12-31")
    ).json()["id"]
    newer_id = client.post(
        "/experiences", json=experience(startDate="2025-05-01", endDate=None)
    ).json()["id"]
    assert [item["id"] for item in client.get("/experiences").json()] == [newer_id, older_id]

    project_id = client.post("/projects", json=project()).json()["id"]
    evidence_id = client.post("/evidence", json=evidence()).json()["id"]
    assert client.post(f"/experiences/{newer_id}/projects/{project_id}").status_code == 200
    assert client.post(f"/experiences/{newer_id}/evidence/{evidence_id}").status_code == 200
    response = client.put(
        f"/experiences/{newer_id}", json=experience(title="Promoted Cloud Analyst")
    )
    assert response.status_code == 200, response.text
    assert response.json()["projects"][0]["id"] == project_id
    assert response.json()["evidence"][0]["id"] == evidence_id


def test_one_project_and_evidence_can_support_multiple_experiences(context):
    client, _ = context
    first_id = client.post("/experiences", json=experience()).json()["id"]
    second_id = client.post("/experiences", json=experience(title="Second role")).json()["id"]
    project_id = client.post("/projects", json=project()).json()["id"]
    evidence_id = client.post("/evidence", json=evidence()).json()["id"]
    for item_id in (first_id, second_id):
        assert client.post(f"/experiences/{item_id}/projects/{project_id}").status_code == 200
        assert client.post(f"/experiences/{item_id}/evidence/{evidence_id}").status_code == 200
    assert client.delete(f"/experiences/{first_id}").status_code == 204
    remaining = client.get(f"/experiences/{second_id}")
    assert remaining.status_code == 200
    assert [item["id"] for item in remaining.json()["projects"]] == [project_id]
    assert [item["id"] for item in remaining.json()["evidence"]] == [evidence_id]
