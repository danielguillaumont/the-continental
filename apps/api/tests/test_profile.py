"""Profile API + real migration tests use disposable SQLite, never user's PostgreSQL."""

import os
from datetime import date
from pathlib import Path
import importlib.util

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, inspect, select  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from alembic.migration import MigrationContext  # noqa: E402
from alembic.operations import Operations  # noqa: E402

from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    Profile, Evidence, Project, Skill, Experience, Certification,
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


def sample(**changes):
    return {
        "fullName": "Sample Developer",
        "headline": "Cloud and security engineer",
        "professionalSummary": "Builds testable systems with repeatable evidence.",
        "location": "Example City",
        "email": "sample@example.org",
        "phone": "+1 (555) 010-0101",
        "websiteUrl": "https://example.org/",
        "githubUrl": "https://github.com/example-account",
        "linkedinUrl": "https://www.linkedin.com/in/example-account",
        "targetRoles": ["Security Engineer", "Platform Engineer"],
        "availableFrom": "2027-01-04",
        **changes,
    }


def test_unconfigured_profile_returns_404(context):
    client, _ = context
    result = client.get("/profile")
    assert result.status_code == 404
    assert "not been configured" in result.json()["detail"]


def test_profile_create_read_update_reuse_one_record(context):
    client, factory = context
    first = client.put("/profile", json=sample())
    assert first.status_code == 200, first.text
    original = first.json()
    assert original["fullName"] == "Sample Developer"
    assert original["availableFrom"] == "2027-01-04"
    assert original["targetRoles"] == ["Security Engineer", "Platform Engineer"]
    assert original["createdAt"] and original["updatedAt"]
    assert client.get("/profile").json() == original

    updated = client.put("/profile", json=sample(
        fullName="  Example User  ", headline="  ", email="  ",
        professionalSummary=None, phone=None, websiteUrl=None,
        githubUrl=None, linkedinUrl=None, availableFrom=None,
        targetRoles=["Cloud Engineer", "cloud engineer", "IAM Analyst"],
    ))
    assert updated.status_code == 200, updated.text
    second = updated.json()
    assert second["fullName"] == "Example User"
    assert second["headline"] is second["email"] is None
    assert second["professionalSummary"] is second["phone"] is None
    assert second["websiteUrl"] is second["githubUrl"] is second["linkedinUrl"] is None
    assert second["availableFrom"] is None
    assert second["targetRoles"] == ["Cloud Engineer", "IAM Analyst"]
    assert second["createdAt"] == original["createdAt"]
    assert client.put("/profile", json=sample(fullName="Example User")).status_code == 200
    with factory() as session:
        assert len(session.scalars(select(Profile)).all()) == 1
        assert session.get(Profile, 1).full_name == "Example User"


def test_profile_validation_rejects_untrustworthy_values(context):
    client, _ = context
    invalid = [
        sample(fullName="  "), sample(fullName="x"),
        sample(fullName="a" * 161), sample(headline="h" * 201),
        sample(professionalSummary="s" * 4001),
        sample(email="missing-at-example.org"),
        sample(websiteUrl="file:///etc/passwd"),
        sample(githubUrl="javascript:alert(1)"),
        sample(availableFrom="not-a-date"),
        sample(targetRoles=[""]),
        sample(targetRoles=["x" * 121]),
        sample(targetRoles=[f"Role{i}" for i in range(13)]),
        {**sample(), "unknownField": "unsupported"},
    ]
    for payload in invalid:
        result = client.put("/profile", json=payload)
        assert result.status_code == 422, (payload, result.text)
    assert client.get("/profile").status_code == 404


def test_profile_does_not_modify_existing_career_records(context):
    client, factory = context
    project = client.post("/projects", json={
        "name": "Existing project", "summary": "Existing saved work", "status": "active",
    })
    assert project.status_code == 201
    evidence = client.post("/evidence", json={
        "kind": "project", "title": "Existing artifact",
        "description": "Real documentation", "skills": ["Infrastructure"],
        "status": "unverified",
    })
    assert evidence.status_code == 201
    with factory() as session:
        before = {
            "projects": len(session.scalars(select(Project)).all()),
            "evidence": len(session.scalars(select(Evidence)).all()),
            "skills": len(session.scalars(select(Skill)).all()),
            "experiences": len(session.scalars(select(Experience)).all()),
            "certifications": len(session.scalars(select(Certification)).all()),
        }
    assert client.put("/profile", json=sample()).status_code == 200
    assert client.put("/profile", json=sample(headline="Updated")).status_code == 200
    with factory() as session:
        assert before == {
            "projects": len(session.scalars(select(Project)).all()),
            "evidence": len(session.scalars(select(Evidence)).all()),
            "skills": len(session.scalars(select(Skill)).all()),
            "experiences": len(session.scalars(select(Experience)).all()),
            "certifications": len(session.scalars(select(Certification)).all()),
        }
    assert client.get(f"/projects/{project.json()['id']}").status_code == 200
    assert client.get(f"/evidence/{evidence.json()['id']}").status_code == 200


def test_profile_singleton_database_constraint(context):
    _, factory = context
    with factory.begin() as session:
        session.add(Profile(id=1, full_name="Example Person", target_roles=[]))
    with pytest.raises(Exception):
        with factory.begin() as session:
            session.add(Profile(id=2, full_name="Another Person", target_roles=[]))
    with factory() as session:
        assert session.get(Profile, 1).full_name == "Example Person"


def test_additive_profile_migration_preserves_prior_schema():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    old_tables = [table for table in Base.metadata.sorted_tables if table.name != "profiles"]
    Base.metadata.create_all(engine, tables=old_tables)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory.begin() as session:
        session.add(Evidence(kind="artifact", title="Existing proof",
                             description="Preserved during migration", status="verified"))
        session.add(Project(name="Existing project", summary="Preserved", status="active"))
        session.add(Experience(organization="Existing employer", title="Engineer",
                               start_date=date(2024, 1, 1), description="Existing role", highlights=[]))
        session.add(Certification(name="Existing credential", issuer="Example issuer"))
    migration = Path(__file__).resolve().parents[1] / "migrations" / "versions" / "b7c2e49a1d03_add_career_profile.py"
    spec = importlib.util.spec_from_file_location("profile_migration_under_test", migration)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.down_revision == "9f4c2e71b6a8"
    with engine.begin() as connection:
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        assert "profiles" in inspect(connection).get_table_names()
    with factory() as session:
        assert session.scalar(select(Evidence)).title == "Existing proof"
        assert session.scalar(select(Project)).name == "Existing project"
        assert session.scalar(select(Experience)).title == "Engineer"
        assert session.scalar(select(Certification)).name == "Existing credential"
        assert session.scalars(select(Profile)).all() == []
    engine.dispose()
