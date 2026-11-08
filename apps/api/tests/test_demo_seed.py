"""v0.3B opt-in seed safety and full in-memory API integration coverage."""

from copy import deepcopy
from pathlib import Path
import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Profile  # noqa: E402
from scripts.demo.seed_v03_demo import (  # noqa: E402
    HttpApi, SeedError, apply, build_plan, load_fixture, preflight, verify,
    validate_backup,
)


class InProcessApi:
    def __init__(self, client):
        self.client = client
        self.writes = []

    def get(self, path):
        response = self.client.get(path)
        assert response.status_code == 200, (path, response.text)
        return response.json()

    def post(self, path, payload=None):
        self.writes.append(path)
        response = self.client.post(path, json=payload)
        assert response.status_code in (200, 201), (path, response.text)
        return response.json()


@pytest.fixture
def context():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override():
        with factory() as session:
            yield session

    app.dependency_overrides[get_database_session] = override
    try:
        with TestClient(app) as client:
            yield InProcessApi(client), factory
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_fixture_is_fictional_and_source_grounded():
    fixture = load_fixture()
    assert len(fixture["projects"]) == 3
    assert len(fixture["evidence"]) == 5
    assert len(fixture["opportunities"]) == 3
    assert all(not record["source"].get("url") and record["status"] == "unverified"
               for record in fixture["evidence"])
    assert all(len(record["requirements"]) == 5 and "fictional" in record["company"].lower()
               for record in fixture["opportunities"])


def test_dry_run_preflight_and_plan_perform_zero_writes(context):
    api, _ = context
    fixture = load_fixture()
    state = preflight(api, fixture)
    plan = build_plan(state, fixture)
    assert sum(step == "CREATE" for step, _, _ in plan) == 26  # 3+5+3+15
    assert sum(step == "LINK" for step, _, _ in plan) == 5
    assert api.writes == []


def test_api_seed_is_idempotent_and_matching_reopens(context):
    api, _ = context
    fixture = load_fixture()
    first = apply(api, fixture, preflight(api, fixture))
    assert first == {"projects": 3, "evidence": 5, "opportunities": 3,
                     "requirements": 15, "links": 5}
    report = verify(api, fixture)
    assert len(report) == 3
    assert all(value["candidatesFound"] >= 1 for value in report.values())
    writes = len(api.writes)
    second = apply(api, fixture, preflight(api, fixture))
    assert all(value == 0 for value in second.values())
    assert len(api.writes) == writes
    assert all(step == "KEEP" for step, _, _ in build_plan(preflight(api, fixture), fixture))


def test_partial_run_recovers_without_duplicate_project(context):
    api, _ = context
    fixture = load_fixture()
    api.post("/projects", fixture["projects"][0])
    result = apply(api, fixture, preflight(api, fixture))
    assert result["projects"] == 2
    assert len(api.get("/projects")) == 3
    assert len(verify(api, fixture)) == 3


def test_existing_real_record_name_collision_is_refused_before_writing(context):
    api, _ = context
    name = load_fixture()["projects"][0]["name"]
    api.post("/projects", {"name": name, "summary": "A real project with this name", "status": "active"})
    before = len(api.writes)
    with pytest.raises(SeedError, match="changed 'summary'"):
        preflight(api, load_fixture())
    assert len(api.writes) == before


def test_manually_changed_demo_evidence_is_not_overwritten(context):
    api, _ = context
    fixture = load_fixture()
    item = fixture["evidence"][0]
    api.post("/evidence", {**{k: v for k, v in item.items() if k != "projectName"},
                           "description": "a different, meaningful record"})
    before = len(api.writes)
    with pytest.raises(SeedError, match="changed 'description'"):
        preflight(api, fixture)
    assert len(api.writes) == before


def test_unrelated_profile_is_untouched(context):
    api, factory = context
    with factory() as session:
        session.add(Profile(full_name="Existing Person", headline="Actual profile", target_roles=[]))
        session.commit()
    apply(api, load_fixture(), preflight(api, load_fixture()))
    with factory() as session:
        profile = session.scalar(select(Profile))
        assert profile.full_name == "Existing Person"
        assert profile.headline == "Actual profile"
    assert not any("/profile" in path or "/experiences" in path for path in api.writes)


def test_reject_nonlocal_api_and_unverified_backup(tmp_path):
    for url in ("https://example.com", "http://127.0.0.1:8001", "http://user@127.0.0.1:8000"):
        with pytest.raises(SeedError):
            HttpApi(url)
    with pytest.raises(SeedError):
        validate_backup(None, None)
    archive = tmp_path / "sample.dump"
    archive.write_bytes(b"fake" * 100)
    with pytest.raises(SeedError, match="SHA-256 mismatch"):
        validate_backup(str(archive), "0" * 64)


def test_source_excerpt_tampering_is_refused(tmp_path):
    fixture = deepcopy(load_fixture())
    fixture["opportunities"][0]["requirements"][0]["text"] = "made up requirement"
    path = tmp_path / "bad.json"
    import json
    path.write_text(json.dumps(fixture), encoding="utf-8")
    with pytest.raises(SeedError, match="literal"):
        load_fixture(path)
