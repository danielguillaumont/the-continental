"""Local integration tests use disposable SQLite, never the real PostgreSQL DB."""

import os
from uuid import UUID, uuid4

# The existing app initializes an engine at import time. Force it to an
# in-memory database before importing the app, independent of any .env file.
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, select  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Evidence, Project, project_evidence  # noqa: E402


@pytest.fixture
def context():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def database_override():
        with factory() as session:
            yield session

    app.dependency_overrides[get_database_session] = database_override
    try:
        with TestClient(app) as client:
            yield client, factory
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def sample_project(**changes):
    return {
        "name": "Sample security console",
        "summary": "A locally tested security demonstration with evidence.",
        "repositoryUrl": "https://github.com/example/demo",
        "status": "active",
        **changes,
    }


def sample_evidence():
    return {
        "kind": "artifact",
        "title": "Threat model document",
        "description": "Design notes and test results for the control.",
        "skills": ["Python", "Security"],
        "status": "verified",
    }


def test_full_project_lifecycle_and_link_integrity(context):
    client, factory = context
    created = client.post("/projects", json=sample_project())
    assert created.status_code == 201, created.text
    project = created.json()
    project_id = project["id"]
    assert project["evidence"] == []
    assert project["repositoryUrl"] == "https://github.com/example/demo"

    evidence_response = client.post("/evidence", json=sample_evidence())
    assert evidence_response.status_code == 201, evidence_response.text
    evidence_id = evidence_response.json()["id"]
    link = f"/projects/{project_id}/evidence/{evidence_id}"

    attached = client.post(link)
    assert attached.status_code == 200, attached.text
    assert attached.json()["evidence"][0]["id"] == evidence_id
    assert attached.json()["evidence"][0]["status"] == "verified"
    assert len(client.post(link).json()["evidence"]) == 1

    updated = client.put(
        f"/projects/{project_id}",
        json=sample_project(name="Updated security console", status="completed"),
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated security console"
    assert updated.json()["status"] == "completed"
    assert len(updated.json()["evidence"]) == 1

    assert len(client.get("/projects").json()) == 1
    assert client.get(f"/projects/{project_id}").status_code == 200

    detached = client.delete(link)
    assert detached.status_code == 200
    assert detached.json()["evidence"] == []
    assert client.delete(link).status_code == 404
    assert client.get(f"/evidence/{evidence_id}").status_code == 200

    assert client.post(link).status_code == 200
    assert client.delete(f"/projects/{project_id}").status_code == 204
    assert client.get(f"/projects/{project_id}").status_code == 404
    assert client.get(f"/evidence/{evidence_id}").status_code == 200

    with factory() as session:
        assert session.scalar(select(Project).where(Project.id == UUID(project_id))) is None
        assert len(session.execute(select(project_evidence)).all()) == 0
        assert session.get(Evidence, UUID(evidence_id)) is not None


def test_invalid_project_and_missing_references(context):
    client, _ = context
    assert client.post("/projects", json=sample_project(name=" ")).status_code == 422
    assert client.post("/projects", json=sample_project(status="done")).status_code == 422
    assert client.post("/projects", json=sample_project(repositoryUrl="javascript:alert(1)")).status_code == 422
    missing_project = str(uuid4())
    missing_evidence = str(uuid4())
    assert client.get(f"/projects/{missing_project}").status_code == 404
    assert client.put(f"/projects/{missing_project}", json=sample_project()).status_code == 404
    assert client.delete(f"/projects/{missing_project}").status_code == 404
    assert client.post(f"/projects/{missing_project}/evidence/{missing_evidence}").status_code == 404

    created = client.post("/projects", json=sample_project()).json()
    assert client.post(f"/projects/{created['id']}/evidence/{missing_evidence}").status_code == 404
    assert client.delete(f"/projects/{created['id']}/evidence/{missing_evidence}").status_code == 404


def test_existing_evidence_routes_still_work(context):
    client, _ = context
    created = client.post("/evidence", json=sample_evidence())
    assert created.status_code == 201
    evidence_id = created.json()["id"]
    assert client.get(f"/evidence/{evidence_id}").status_code == 200
    assert len(client.get("/evidence").json()) == 1
    assert client.put(f"/evidence/{evidence_id}", json=sample_evidence()).status_code == 200
    assert client.delete(f"/evidence/{evidence_id}").status_code == 204


def test_deleting_linked_evidence_does_not_delete_project(context):
    client, _ = context
    project_id = client.post("/projects", json=sample_project()).json()["id"]
    evidence_id = client.post("/evidence", json=sample_evidence()).json()["id"]
    assert client.post(f"/projects/{project_id}/evidence/{evidence_id}").status_code == 200
    assert client.delete(f"/evidence/{evidence_id}").status_code == 204
    project = client.get(f"/projects/{project_id}")
    assert project.status_code == 200
    assert project.json()["evidence"] == []


def test_additive_migration_preserves_existing_evidence():
    """Exercise the actual new Alembic upgrade in a disposable old-schema DB."""
    import importlib.util
    from pathlib import Path

    from alembic.migration import MigrationContext
    from alembic.operations import Operations
    from sqlalchemy import inspect
    from app.models import Skill, evidence_skills

    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine, tables=[Skill.__table__, Evidence.__table__, evidence_skills])
    factory = sessionmaker(bind=engine)
    with factory.begin() as session:
        record = Evidence(
            kind="artifact", title="Existing record",
            description="Data saved before the new migration.",
            status="unverified",
        )
        session.add(record)
        session.flush()
        evidence_id = record.id

    migration_path = (
        Path(__file__).resolve().parents[1] / "migrations" / "versions"
        / "8d2e7af4c9b1_add_projects_and_evidence_links.py"
    )
    spec = importlib.util.spec_from_file_location("project_migration_under_test", migration_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    with engine.begin() as connection:
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        tables = inspect(connection).get_table_names()
        assert "projects" in tables
        assert "project_evidence" in tables
        assert "evidence" in tables

    with factory() as session:
        assert session.get(Evidence, evidence_id).title == "Existing record"
    engine.dispose()
