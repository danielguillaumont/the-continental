"""v0.3D1: explicit, reversible human review of Evidence Match candidates."""

import os
from pathlib import Path
import sys
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.database import Base, get_database_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Evidence, EvidenceReview, Opportunity, Project, Requirement, Skill  # noqa: E402


@pytest.fixture
def context():
    engine = create_engine("sqlite+pysqlite:///:memory:",
                           connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override():
        with factory() as session:
            yield session

    app.dependency_overrides[get_database_session] = override
    try:
        with factory() as session:
            skill = Skill(name="Python", normalized_name="python")
            match = Evidence(title="Python regression tests", kind="artifact",
                             description="Reviewed Python security automation fixture",
                             status="unverified", skills=[skill])
            other = Evidence(title="Linux recovery plan", kind="artifact",
                             description="Unrelated Linux fixture", status="unverified")
            requirement = Requirement(position=0, kind="required", text="Build Python security automation")
            second = Requirement(position=1, kind="preferred", text="Handle incident response")
            opportunity = Opportunity(source_text="Build Python security automation. Handle incident response.",
                                      title="AppSec Engineer", requirements=[requirement, second])
            another = Opportunity(source_text="Other job", title="Other job",
                                  requirements=[Requirement(position=0, kind="required", text="Python")])
            session.add_all([match, other, opportunity, another]); session.commit()
            ids = dict(opportunity=str(opportunity.id), requirement=str(requirement.id),
                       other_requirement=str(second.id), evidence=str(match.id),
                       other_evidence=str(other.id), other_opportunity=str(another.id),
                       other_opportunity_requirement=str(another.requirements[0].id))
        with TestClient(app) as client:
            yield client, factory, ids
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def base(context):
    client, _, ids = context
    opportunity = ids["opportunity"]
    requirement = ids["requirement"]
    evidence = ids["evidence"]
    url = f"/opportunities/{opportunity}/requirements/{requirement}/evidence-reviews/{evidence}"
    opts = client.get(f"/opportunities/{opportunity}/evidence-review-options")
    assert opts.status_code == 200, opts.text
    options = opts.json()["candidates"]
    assert len(options) == 1
    return url, options[0]["fingerprint"]


def payload(fingerprint, decision="supports", note="I reviewed the linked regression suite and its source."):
    return {"decision": decision, "note": note, "expectedFingerprint": fingerprint}


def test_empty_reviews_and_options_are_read_only(context):
    client, factory, ids = context
    url, token = base(context)
    assert len(token) == 64
    response = client.get(f"/opportunities/{ids['opportunity']}/evidence-reviews")
    assert response.status_code == 200
    assert response.json()["reviews"] == []
    with factory() as session:
        assert session.query(EvidenceReview).count() == 0
    assert client.get(f"/opportunities/{ids['opportunity']}/evidence-match-preview").status_code == 200


def test_accept_and_reject_are_saved_without_verification_claim(context):
    client, factory, ids = context
    url, token = base(context)
    response = client.put(url, json=payload(token))
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["decision"] == "supports" and body["reviewStatus"] == "current"
    assert body["currentCandidate"] is True
    assert body["note"].startswith("I reviewed")
    assert body["requirementTextAtReview"] == "Build Python security automation"
    with factory() as session:
        evidence = session.get(Evidence, UUID(ids["evidence"]))
        assert evidence.status == "unverified"
    rejected = client.put(url, json=payload(token, "not_relevant", ""))
    assert rejected.status_code == 200
    assert rejected.json()["decision"] == "not_relevant"
    assert rejected.json()["id"] == body["id"]


def test_same_pair_is_idempotent_and_no_duplicate_reviews(context):
    client, factory, ids = context
    url, token = base(context)
    first = client.put(url, json=payload(token)).json()
    second = client.put(url, json=payload(token)).json()
    assert first["id"] == second["id"]
    with factory() as session:
        assert session.query(EvidenceReview).count() == 1


def test_stale_token_is_rejected_without_writing(context):
    client, factory, ids = context
    url, token = base(context)
    with factory() as session:
        requirement = session.get(Requirement, UUID(ids["requirement"]))
        requirement.text = "Build Python security automation in containers"
        session.commit()
    result = client.put(url, json=payload(token))
    assert result.status_code == 409
    with factory() as session:
        assert session.query(EvidenceReview).count() == 0


def test_edited_requirement_marks_existing_decision_stale(context):
    client, factory, ids = context
    url, token = base(context)
    assert client.put(url, json=payload(token)).status_code == 200
    with factory() as session:
        requirement = session.get(Requirement, UUID(ids["requirement"]))
        requirement.text = "Write Python automation for incident tooling"
        session.commit()
    result = client.get(f"/opportunities/{ids['opportunity']}/evidence-reviews")
    review = result.json()["reviews"][0]
    assert review["reviewStatus"] == "stale" and review["currentCandidate"] is True
    assert review["requirementTextAtReview"] == "Build Python security automation"
    options = client.get(f"/opportunities/{ids['opportunity']}/evidence-review-options").json()
    assert options["candidates"][0]["currentReview"]["reviewStatus"] == "stale"


def test_skill_link_removed_preserves_stale_history(context):
    client, factory, ids = context
    url, token = base(context)
    assert client.put(url, json=payload(token)).status_code == 200
    with factory() as session:
        evidence = session.get(Evidence, UUID(ids["evidence"]))
        evidence.skills.clear()
        session.commit()
    result = client.get(f"/opportunities/{ids['opportunity']}/evidence-reviews").json()
    assert result["reviews"][0]["reviewStatus"] == "stale"
    assert result["reviews"][0]["currentCandidate"] is False
    opts = client.get(f"/opportunities/{ids['opportunity']}/evidence-review-options").json()
    assert opts["candidates"] == []


def test_non_candidate_cannot_be_reviewed(context):
    client, factory, ids = context
    _, token = base(context)
    url = (f"/opportunities/{ids['opportunity']}/requirements/{ids['requirement']}"
           f"/evidence-reviews/{ids['other_evidence']}")
    result = client.put(url, json=payload(token))
    assert result.status_code == 409
    with factory() as session:
        assert session.query(EvidenceReview).count() == 0


def test_wrong_opportunity_requirement_pair_is_not_exposed(context):
    client, _, ids = context
    _, token = base(context)
    url = (f"/opportunities/{ids['other_opportunity']}/requirements/{ids['requirement']}"
           f"/evidence-reviews/{ids['evidence']}")
    assert client.put(url, json=payload(token)).status_code == 404
    assert client.get(f"/opportunities/{uuid4()}/evidence-review-options").status_code == 404


def test_invalid_payload_rejected_before_database_write(context):
    client, factory, ids = context
    url, token = base(context)
    cases = [
        payload(token, "supports", "too short"),
        payload(token, "approved", "A very convincing evidence review."),
        payload("x" * 64),
        payload(token, "supports", "X" * 1201),
        {**payload(token), "verified": True},
    ]
    for data in cases:
        response = client.put(url, json=data)
        assert response.status_code == 422, response.text
    with factory() as session:
        assert session.query(EvidenceReview).count() == 0


def test_delete_is_explicit_and_does_not_delete_evidence(context):
    client, factory, ids = context
    url, token = base(context)
    assert client.put(url, json=payload(token)).status_code == 200
    assert client.delete(url).status_code == 204
    assert client.delete(url).status_code == 404
    with factory() as session:
        assert session.query(EvidenceReview).count() == 0
        assert session.get(Evidence, UUID(ids["evidence"])) is not None


def test_two_requirements_and_opportunities_remain_isolated(context):
    client, factory, ids = context
    url, token = base(context)
    assert client.put(url, json=payload(token)).status_code == 200
    second_url = (f"/opportunities/{ids['other_opportunity']}/requirements/"
                  f"{ids['other_opportunity_requirement']}/evidence-reviews/{ids['evidence']}")
    second_options = client.get(
        f"/opportunities/{ids['other_opportunity']}/evidence-review-options"
    ).json()["candidates"]
    assert client.put(second_url, json=payload(second_options[0]["fingerprint"],
                                                 "not_relevant", "Not the right scope")).status_code == 200
    assert len(client.get(f"/opportunities/{ids['opportunity']}/evidence-reviews").json()["reviews"]) == 1
    assert len(client.get(f"/opportunities/{ids['other_opportunity']}/evidence-reviews").json()["reviews"]) == 1
    with factory() as session:
        assert session.query(EvidenceReview).count() == 2


def test_evidence_material_change_marks_review_stale(context):
    client, factory, ids = context
    url, token = base(context)
    assert client.put(url, json=payload(token)).status_code == 200
    with factory() as session:
        evidence = session.get(Evidence, UUID(ids["evidence"]))
        evidence.description = "Rewritten implementation notes with different scope"
        session.commit()
    review = client.get(f"/opportunities/{ids['opportunity']}/evidence-reviews").json()["reviews"][0]
    assert review["reviewStatus"] == "stale"
    assert review["currentCandidate"] is True


def test_project_relationship_change_invalidates_prior_review(context):
    client, factory, ids = context
    url, token = base(context)
    assert client.put(url, json=payload(token)).status_code == 200
    with factory() as session:
        project = Project(name="Test project", summary="An explicitly separate fixture")
        evidence = session.get(Evidence, UUID(ids["evidence"]))
        evidence.projects.append(project)
        session.commit()
    review = client.get(f"/opportunities/{ids['opportunity']}/evidence-reviews").json()["reviews"][0]
    assert review["reviewStatus"] == "stale"


def test_re_review_after_change_refreshes_snapshot(context):
    client, factory, ids = context
    url, token = base(context)
    original = client.put(url, json=payload(token)).json()
    with factory() as session:
        requirement = session.get(Requirement, UUID(ids["requirement"]))
        requirement.text = "Python security automation and testing"
        session.commit()
    assert client.put(url, json=payload(token)).status_code == 409
    updated_token = base(context)[1]
    updated = client.put(url, json=payload(updated_token, note="Reinspected after text change.")).json()
    assert updated["id"] == original["id"]
    assert updated["reviewStatus"] == "current"
    assert updated["requirementTextAtReview"] == "Python security automation and testing"


def test_only_finite_candidates_returned_with_explicit_truncation(context):
    client, factory, ids = context
    with factory() as session:
        python = session.scalar(select(Skill).where(Skill.normalized_name == "python"))
        for index in range(30):
            session.add(Evidence(title=f"Sample {index:02}", kind="artifact",
                                 description="Bounded record", status="unverified", skills=[python]))
        session.commit()
    opts = client.get(f"/opportunities/{ids['opportunity']}/evidence-review-options").json()
    assert len([item for item in opts["candidates"] if item["requirementId"] == ids["requirement"]]) == 25
    assert opts["truncatedRequirementIds"] == [ids["requirement"]]


def test_new_revision_can_upgrade_and_downgrade_disposable_schema():
    """Test only the new migration; older historical migrations use PG ARRAY."""
    import importlib.util
    from alembic.migration import MigrationContext
    from alembic.operations import Operations
    from sqlalchemy import inspect

    engine = create_engine("sqlite+pysqlite:///:memory:")
    with engine.begin() as connection:
        Base.metadata.create_all(connection, tables=[
            table for table in Base.metadata.sorted_tables
            if table.name != "evidence_reviews"
        ])
        filename = (Path(__file__).resolve().parents[1] / "migrations" / "versions" /
                    "a1d8c4f60e32_add_evidence_reviews.py")
        spec = importlib.util.spec_from_file_location("continental_3d1_migration", filename)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        assert "evidence_reviews" in inspect(connection).get_table_names()
        indexes = {row["name"] for row in inspect(connection).get_indexes("evidence_reviews")}
        assert "ix_evidence_reviews_requirement_id" in indexes
        assert "ix_evidence_reviews_evidence_id" in indexes
        module.downgrade()
        assert "evidence_reviews" not in inspect(connection).get_table_names()
    engine.dispose()
