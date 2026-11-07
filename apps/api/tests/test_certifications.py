"""Disposable SQLite certification API tests; never use the live local database."""

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
    Certification, Evidence, Experience, Project, Skill,
    certification_evidence, certification_skills,
    evidence_skills, experience_evidence, experience_projects, project_evidence,
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


def credential(**changes):
    return {
        "name": "Cloud Security Associate",
        "issuer": "Example Credential Board",
        "credentialId": "ABC-123",
        "credentialUrl": "https://example.org/verify/ABC-123",
        "issuedAt": "2025-02-10",
        "expiresAt": "2028-02-10",
        "description": "Passed an assessment covering cloud security fundamentals.",
        **changes,
    }


def evidence():
    return {
        "kind": "certification",
        "title": "Credential exam result",
        "description": "An artifact recording the actual exam outcome.",
        "skills": ["Cloud Security"],
        "status": "unverified",
    }


def test_create_list_read_update_delete(context):
    client, _ = context
    created = client.post("/certifications", json=credential())
    assert created.status_code == 201, created.text
    item = created.json()
    UUID(item["id"])
    assert item["skills"] == item["evidence"] == []
    assert item["name"] == "Cloud Security Associate"
    assert item["issuedAt"] == "2025-02-10"
    assert item["credentialUrl"] == "https://example.org/verify/ABC-123"
    assert item["createdAt"] and item["updatedAt"]
    assert len(client.get("/certifications").json()) == 1
    assert client.get(f"/certifications/{item['id']}").json()["issuer"] == "Example Credential Board"

    updated = client.put(
        f"/certifications/{item['id']}",
        json=credential(name="Cloud Security Professional", expiresAt=None,
                        credentialId=None, credentialUrl=None, description=None),
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["name"] == "Cloud Security Professional"
    assert updated.json()["expiresAt"] is None
    assert updated.json()["credentialId"] is None
    assert updated.json()["credentialUrl"] is None
    assert updated.json()["description"] is None
    assert client.delete(f"/certifications/{item['id']}").status_code == 204
    assert client.get(f"/certifications/{item['id']}").status_code == 404
    assert client.get("/certifications").json() == []


def test_optional_dates_and_values_stay_null(context):
    client, _ = context
    created = client.post(
        "/certifications",
        json={"name": "  Linux Essentials  ", "issuer": "  Example Institute  ",
              "credentialId": "  ", "description": "   ",
              "issuedAt": None, "expiresAt": None, "credentialUrl": None},
    )
    assert created.status_code == 201, created.text
    item = created.json()
    assert item["name"] == "Linux Essentials"
    assert item["issuer"] == "Example Institute"
    assert item["credentialId"] is item["description"] is None
    assert item["issuedAt"] is item["expiresAt"] is None


def test_validation_rejects_bad_credential_data(context):
    client, _ = context
    invalid_payloads = [
        credential(name=" "), credential(issuer="  "),
        credential(issuedAt="not-a-date"),
        credential(expiresAt="2024-12-01"),
        credential(credentialUrl="file:///etc/passwd"),
        credential(credentialUrl="localhost:1234"),
        credential(name="x" * 161),
        credential(credentialId="X" * 161),
        credential(description="X" * 2001),
    ]
    for payload in invalid_payloads:
        result = client.post("/certifications", json=payload)
        assert result.status_code == 422, (payload, result.text)
    assert client.get("/certifications").json() == []


def test_missing_ids_and_invalid_uuid(context):
    client, _ = context
    missing = str(uuid4())
    assert client.get(f"/certifications/{missing}").status_code == 404
    assert client.put(f"/certifications/{missing}", json=credential()).status_code == 404
    assert client.delete(f"/certifications/{missing}").status_code == 404
    assert client.get("/certifications/not-a-uuid").status_code == 422
    assert client.post(f"/certifications/{missing}/evidence/{missing}").status_code == 404
    assert client.post(f"/certifications/{missing}/skills/{missing}").status_code == 404


def test_nonowning_skill_and_evidence_relationships(context):
    client, factory = context
    certification_id = client.post("/certifications", json=credential()).json()["id"]
    evidence_id = client.post("/evidence", json=evidence()).json()["id"]
    with factory() as session:
        skill_id = str(session.scalar(select(Skill)).id)
    skill_route = f"/certifications/{certification_id}/skills/{skill_id}"
    evidence_route = f"/certifications/{certification_id}/evidence/{evidence_id}"

    for _ in range(2):
        assert len(client.post(skill_route).json()["skills"]) == 1
        assert len(client.post(evidence_route).json()["evidence"]) == 1
    item = client.get(f"/certifications/{certification_id}").json()
    assert item["skills"][0]["name"] == "Cloud Security"
    assert item["evidence"][0]["title"] == "Credential exam result"
    assert client.delete(skill_route).json()["skills"] == []
    assert client.delete(evidence_route).json()["evidence"] == []
    assert client.delete(skill_route).status_code == 404
    assert client.delete(evidence_route).status_code == 404
    assert client.post(skill_route).status_code == 200
    assert client.post(evidence_route).status_code == 200

    assert client.delete(f"/certifications/{certification_id}").status_code == 204
    assert client.get(f"/evidence/{evidence_id}").status_code == 200
    assert client.get(f"/skills/{skill_id}").status_code == 200
    with factory() as session:
        assert session.get(Certification, UUID(certification_id)) is None
        assert session.execute(select(certification_skills)).all() == []
        assert session.execute(select(certification_evidence)).all() == []


def test_deleted_sources_keep_credential_and_other_records(context):
    client, factory = context
    cert_id = client.post("/certifications", json=credential()).json()["id"]
    evidence_id = client.post("/evidence", json=evidence()).json()["id"]
    with factory() as session:
        skill_id = str(session.scalar(select(Skill)).id)
    assert client.post(f"/certifications/{cert_id}/evidence/{evidence_id}").status_code == 200
    assert client.post(f"/certifications/{cert_id}/skills/{skill_id}").status_code == 200
    assert client.delete(f"/evidence/{evidence_id}").status_code == 204
    record = client.get(f"/certifications/{cert_id}")
    assert record.status_code == 200
    assert record.json()["evidence"] == []
    # Skill entity remains as an unsupported, owner-entered skill reference.
    assert len(record.json()["skills"]) == 1
    assert client.get(f"/skills/{skill_id}").json()["coverage"] == "unsupported"


def test_missing_relationship_targets_are_explicit(context):
    client, _ = context
    cert_id = client.post("/certifications", json=credential()).json()["id"]
    missing = str(uuid4())
    assert client.post(f"/certifications/{cert_id}/skills/{missing}").status_code == 404
    assert client.delete(f"/certifications/{cert_id}/skills/{missing}").status_code == 404
    assert client.post(f"/certifications/{cert_id}/evidence/{missing}").status_code == 404
    assert client.delete(f"/certifications/{cert_id}/evidence/{missing}").status_code == 404
    assert client.get(f"/certifications/{cert_id}").json()["skills"] == []
    assert client.get(f"/certifications/{cert_id}").json()["evidence"] == []


def test_existing_experience_projects_and_skill_proof_unchanged(context):
    client, _ = context
    project = client.post("/projects", json={
        "name": "Existing project", "summary": "Real supporting work", "status": "active",
    })
    assert project.status_code == 201
    report = client.post("/evidence", json=evidence())
    assert report.status_code == 201
    skills_before = client.get("/skills").json()
    assert client.post("/certifications", json=credential()).status_code == 201
    assert client.get(f"/projects/{project.json()['id']}").status_code == 200
    assert client.get(f"/evidence/{report.json()['id']}").status_code == 200
    assert client.get("/skills").json() == skills_before
    assert client.get("/experiences").json() == []


def test_additive_alembic_migration_preserves_prior_tables():
    """Apply the actual migration to the old schema in temporary SQLite."""
    import importlib.util
    from pathlib import Path
    from alembic.migration import MigrationContext
    from alembic.operations import Operations

    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    old_tables = [
        Skill.__table__, Evidence.__table__, evidence_skills,
        Project.__table__, project_evidence,
        Experience.__table__, experience_projects, experience_evidence,
    ]
    Base.metadata.create_all(engine, tables=old_tables)
    factory = sessionmaker(bind=engine)
    with factory.begin() as session:
        old_evidence = Evidence(kind="artifact", title="Existing evidence",
                                description="Saved before credentials existed.", status="verified")
        old_project = Project(name="Existing project", summary="Saved earlier", status="active")
        old_experience = Experience(organization="Older employer", title="Analyst",
                                    start_date=__import__("datetime").date(2024, 1, 1),
                                    description="A valid existing experience record.", highlights=[])
        session.add_all([old_evidence, old_project, old_experience])
        session.flush()
        ids = (old_evidence.id, old_project.id, old_experience.id)

    migration = (Path(__file__).resolve().parents[1] / "migrations" / "versions"
                 / "9f4c2e71b6a8_add_certification_registry.py")
    spec = importlib.util.spec_from_file_location("certification_migration_under_test", migration)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.down_revision == "6b7e3a91c4d2"
    with engine.begin() as connection:
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        tables = set(inspect(connection).get_table_names())
        assert {"certifications", "certification_skills", "certification_evidence"} <= tables
        assert {"evidence", "projects", "experiences", "skills"} <= tables
    with factory() as session:
        assert session.get(Evidence, ids[0]).title == "Existing evidence"
        assert session.get(Project, ids[1]).name == "Existing project"
        assert session.get(Experience, ids[2]).title == "Analyst"
        assert session.scalars(select(Certification)).all() == []
    engine.dispose()
