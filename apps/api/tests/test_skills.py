"""Skills & Proof integration tests use isolated SQLite, never live PostgreSQL."""

import os
from uuid import UUID, uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, select  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Evidence, Skill, evidence_skills  # noqa: E402


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


def evidence(title="Proof example", skills=None, status="verified", **changes):
    return {
        "kind": "artifact", "title": title,
        "description": "A reproducible example that documents a real output.",
        "skills": skills if skills is not None else ["Python"],
        "status": status, **changes,
    }


def test_empty_skill_inventory_and_not_found(context):
    client, _ = context
    assert client.get("/skills").json() == []
    assert client.get(f"/skills/{uuid4()}").status_code == 404
    assert client.get("/skills/not-a-uuid").status_code == 422


def test_skills_are_casefolded_reused_and_sorted(context):
    client, factory = context
    for title, skills in [
        ("First evidence", ["Python", "Terraform"]),
        ("Second evidence", [" python ", "Kubernetes"]),
    ]:
        assert client.post("/evidence", json=evidence(title, skills)).status_code == 201
    items = client.get("/skills").json()
    assert [item["normalizedName"] for item in items] == ["kubernetes", "python", "terraform"]
    assert [item["name"] for item in items] == ["Kubernetes", "Python", "Terraform"]
    assert [item["evidenceCount"] for item in items] == [1, 2, 1]
    assert items[1]["verifiedCount"] == 2
    assert items[1]["coverage"] == "verified"
    with factory() as session:
        assert len(session.scalars(select(Skill)).all()) == 3
        assert len(session.execute(select(evidence_skills)).all()) == 4


def test_skill_detail_exposes_inspectable_provenance(context):
    client, _ = context
    record = client.post("/evidence", json=evidence(
        source={"label": "GitHub", "url": "https://github.com/example/project"},
        occurredAt="2025-12-15",
    )).json()
    skill_id = client.get("/skills").json()[0]["id"]
    detail = client.get(f"/skills/{skill_id}")
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["evidenceCount"] == 1
    assert body["verifiedCount"] == 1
    assert body["unverifiedCount"] == 0
    assert body["coverage"] == "verified"
    assert len(body["evidence"]) == 1
    proof = body["evidence"][0]
    assert proof["id"] == record["id"]
    assert proof["kind"] == "artifact"
    assert proof["status"] == "verified"
    assert proof["sourceLabel"] == "GitHub"
    assert proof["sourceUrl"] == "https://github.com/example/project"
    assert proof["occurredAt"] == "2025-12-15"
    assert proof["description"] and proof["createdAt"] and proof["updatedAt"]
    UUID(body["id"])


def test_unverified_proof_is_not_misrepresented_as_verified(context):
    client, _ = context
    record = client.post("/evidence", json=evidence(status="unverified")).json()
    summary = client.get("/skills").json()[0]
    assert summary["coverage"] == "unverified"
    assert summary["evidenceCount"] == 1
    assert summary["verifiedCount"] == 0
    assert summary["unverifiedCount"] == 1
    changed = client.put(f"/evidence/{record['id']}", json=evidence(status="verified"))
    assert changed.status_code == 200
    assert client.get("/skills").json()[0]["coverage"] == "verified"


def test_evidence_edits_change_proof_without_migrating_skill_ids(context):
    client, _ = context
    record = client.post("/evidence", json=evidence(skills=["Python"])).json()
    python_id = client.get("/skills").json()[0]["id"]
    changed = client.put(f"/evidence/{record['id']}", json=evidence(skills=["Go"]))
    assert changed.status_code == 200
    summaries = {item["name"]: item for item in client.get("/skills").json()}
    assert summaries["Python"]["id"] == python_id
    assert summaries["Python"]["coverage"] == "unsupported"
    assert summaries["Python"]["evidenceCount"] == 0
    assert summaries["Go"]["evidenceCount"] == 1
    assert client.get(f"/skills/{python_id}").json()["evidence"] == []


def test_removing_evidence_preserves_skill_with_zero_proof(context):
    client, _ = context
    record = client.post("/evidence", json=evidence()).json()
    skill_id = client.get("/skills").json()[0]["id"]
    assert client.delete(f"/evidence/{record['id']}").status_code == 204
    skill = client.get(f"/skills/{skill_id}").json()
    assert skill["coverage"] == "unsupported"
    assert skill["evidenceCount"] == 0
    assert skill["verifiedCount"] == 0
    assert skill["evidence"] == []


def test_mixed_proof_counts_are_not_double_counted(context):
    client, _ = context
    for title, status in [("Verified output", "verified"), ("Draft notes", "unverified")]:
        assert client.post("/evidence", json=evidence(title=title, status=status)).status_code == 201
    skill = client.get("/skills").json()[0]
    assert skill["evidenceCount"] == 2
    assert skill["verifiedCount"] == 1
    assert skill["unverifiedCount"] == 1
    detail = client.get(f"/skills/{skill['id']}").json()
    assert len({record["id"] for record in detail["evidence"]}) == 2


def test_reads_do_not_modify_evidence_or_skill_relationships(context):
    client, factory = context
    source_id = client.post("/evidence", json=evidence()).json()["id"]
    with factory() as session:
        before = (len(session.scalars(select(Evidence)).all()),
                  len(session.scalars(select(Skill)).all()),
                  len(session.execute(select(evidence_skills)).all()))
    for _ in range(2):
        listed = client.get("/skills").json()
        assert client.get(f"/skills/{listed[0]['id']}").status_code == 200
    with factory() as session:
        after = (len(session.scalars(select(Evidence)).all()),
                 len(session.scalars(select(Skill)).all()),
                 len(session.execute(select(evidence_skills)).all()))
    assert before == after == (1, 1, 1)
    assert client.get(f"/evidence/{source_id}").status_code == 200
