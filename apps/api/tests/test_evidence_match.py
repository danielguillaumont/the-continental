"""Evidence Match v0.3A: read-only projection and conservative matching tests."""

from datetime import date
import os
from pathlib import Path
import sys
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.database import Base, get_database_session  # noqa: E402
from app.evidence_match import find_literal_skill  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    Evidence, Experience, Opportunity, Project, Requirement, Skill,
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


def create_opportunity(session, requirements=None, title="Cloud Security Engineer"):
    opportunity = Opportunity(
        title=title,
        company="Northstar Platform Labs (fictional)",
        source_text="Cloud security engineer. Required: Python, Terraform and Kubernetes. ",
        requirements=[
            Requirement(text=text, kind=kind, position=index)
            for index, (text, kind) in enumerate(requirements or [])
        ],
    )
    session.add(opportunity)
    session.flush()
    return opportunity


def create_evidence(session, title, skill_names, projects=(), experiences=()):
    skills = []
    for name in skill_names:
        skill = session.scalar(select(Skill).where(Skill.normalized_name == name.casefold()))
        if skill is None:
            skill = Skill(name=name, normalized_name=name.casefold())
            session.add(skill)
        skills.append(skill)
    evidence = Evidence(
        title=title, kind="project", description="Documented sample implementation",
        status="unverified", source_label="Example repository", skills=skills,
    )
    evidence.projects.extend(projects)
    evidence.experiences.extend(experiences)
    session.add(evidence)
    session.flush()
    return evidence


def test_empty_opportunity_returns_zero_summary_without_writes(context):
    client, factory = context
    with factory() as session:
        item = create_opportunity(session)
        session.commit()
        opportunity_id = item.id
    result = client.get(f"/opportunities/{opportunity_id}/evidence-match-preview")
    assert result.status_code == 200, result.text
    body = result.json()
    assert body["schemaVersion"] == "continental.v03.evidence-match.v1"
    assert body["mode"] == "deterministic_explicit_skill_tags"
    assert body["summary"] == {
        "totalRequirements": 0, "candidatesFound": 0,
        "noLinkedEvidence": 0, "noExplicitSkillTag": 0,
    }
    assert body["requirements"] == []
    assert "no qualification" in body["caveat"].lower()


def test_linked_projects_and_experience_are_shown_without_claiming_fit(context):
    client, factory = context
    with factory() as session:
        item = create_opportunity(session, [
            ("Build Python APIs and Terraform controls", "required"),
            ("Knowledge of Kubernetes", "preferred"),
        ])
        project = Project(
            name="Firedoor", summary="Cluster control validation showcase", status="active",
        )
        experience = Experience(
            organization="Example Engineering Cooperative", title="Infrastructure Engineer",
            start_date=date(2024, 1, 1), description="Worked on cloud automation",
            highlights=[],
        )
        session.add_all([project, experience])
        session.flush()
        item_evidence = create_evidence(
            session, "Kubernetes cluster security control", ["Python", "Terraform"],
            projects=[project], experiences=[experience],
        )
        session.commit()
        opportunity_id, evidence_id = item.id, item_evidence.id
    result = client.get(f"/opportunities/{opportunity_id}/evidence-match-preview")
    assert result.status_code == 200, result.text
    body = result.json()
    assert body["summary"] == {
        "totalRequirements": 2, "candidatesFound": 1,
        "noLinkedEvidence": 0, "noExplicitSkillTag": 1,
    }
    req = body["requirements"][0]
    assert req["kind"] == "required"
    assert req["outcome"] == "candidates_found"
    assert {skill["name"] for skill in req["matchedSkills"]} == {"Python", "Terraform"}
    assert req["candidateCount"] == 1
    candidate = req["evidenceCandidates"][0]
    assert candidate["id"] == str(evidence_id)
    assert candidate["ownerStatus"] == "unverified"
    assert candidate["sourceLabel"] == "Example repository"
    assert len(candidate["matchedSkillIds"]) == 2
    assert candidate["projects"][0]["name"] == "Firedoor"
    assert candidate["experiences"][0]["title"] == "Infrastructure Engineer"
    assert "no qualification" in body["caveat"].lower()
    assert body["requirements"][1]["outcome"] == "no_explicit_skill_tag"


def test_no_linked_evidence_differs_from_unrecognized_prose(context):
    client, factory = context
    with factory() as session:
        item = create_opportunity(session, [
            ("Experience with Kubernetes", "required"),
            ("Able to explain architecture", "preferred"),
        ])
        session.add(Skill(name="Kubernetes", normalized_name="kubernetes"))
        session.commit()
        opportunity_id = item.id
    result = client.get(f"/opportunities/{opportunity_id}/evidence-match-preview")
    body = result.json()
    assert body["summary"]["noLinkedEvidence"] == 1
    assert body["summary"]["noExplicitSkillTag"] == 1
    assert body["requirements"][0]["outcome"] == "no_linked_evidence"
    assert body["requirements"][1]["matchedSkills"] == []
    assert body["requirements"][1]["outcome"] == "no_explicit_skill_tag"


def test_literal_boundaries_and_short_ambiguous_tags():
    assert find_literal_skill("Build with Python, Terraform and .NET", "python") == "Python"
    assert find_literal_skill("Strong Terraform skills", "Terraform") == "Terraform"
    assert find_literal_skill("TerraformCloud experience", "Terraform") is None
    assert find_literal_skill("Maintain AWSome infra", "AWS") is None
    assert find_literal_skill("We use CI/CD pipelines", "CI/CD") == "CI/CD"
    assert find_literal_skill("Experience with C++", "C++") == "C++"
    assert find_literal_skill("They want go-to solutions", "Go") is None
    assert find_literal_skill("Build services in Go", "Go") == "Go"
    assert find_literal_skill("Develop in go", "Go") is None
    assert find_literal_skill("Kubernetes security", "") is None


def test_candidates_remain_separate_across_opportunities(context):
    client, factory = context
    with factory() as session:
        one = create_opportunity(session, [("Python required", "required")])
        two = create_opportunity(session, [("Terraform required", "required")])
        create_evidence(session, "API automation", ["Python"])
        session.commit()
        one_id, two_id = one.id, two.id
    one_report = client.get(f"/opportunities/{one_id}/evidence-match-preview").json()
    two_report = client.get(f"/opportunities/{two_id}/evidence-match-preview").json()
    assert one_report["summary"]["candidatesFound"] == 1
    # A skill not registered in the career record is not automatically invented.
    assert two_report["summary"]["noExplicitSkillTag"] == 1


def test_report_changes_after_evidence_link_changes_without_persisted_matches(context):
    client, factory = context
    with factory() as session:
        item = create_opportunity(session, [("Required Python", "required")])
        evidence = create_evidence(session, "Python lint automation", ["Python"])
        session.commit()
        item_id, evidence_id = item.id, evidence.id
    url = f"/opportunities/{item_id}/evidence-match-preview"
    first = client.get(url).json()
    assert first["summary"]["candidatesFound"] == 1
    with factory() as session:
        session.delete(session.get(Evidence, evidence_id))
        session.commit()
    second = client.get(url).json()
    assert second["summary"]["noLinkedEvidence"] == 1
    assert second["requirements"][0]["evidenceCandidates"] == []


def test_deterministic_sort_order_and_bounded_output(context):
    client, factory = context
    with factory() as session:
        item = create_opportunity(session, [("Python", "required")])
        for index in range(30):
            create_evidence(session, f"Sample evidence {index:02}", ["Python"])
        session.commit()
        item_id = item.id
    url = f"/opportunities/{item_id}/evidence-match-preview"
    first = client.get(url).json()["requirements"][0]
    second = client.get(url).json()["requirements"][0]
    assert first == second
    assert first["candidateCount"] == 30
    assert first["truncated"] is True
    assert len(first["evidenceCandidates"]) == 25
    assert first["evidenceCandidates"][0]["title"] == "Sample evidence 00"


def test_missing_opportunity_returns_404(context):
    client, _ = context
    assert client.get(f"/opportunities/{uuid4()}/evidence-match-preview").status_code == 404


def test_matches_do_not_write_rows_or_modify_input_requirement(context):
    client, factory = context
    with factory() as session:
        item = create_opportunity(session, [("Python experience", "required")])
        create_evidence(session, "Python automation", ["Python"])
        session.commit()
        item_id = item.id
    with factory() as session:
        before = session.get(Opportunity, item_id)
        original = [(r.id, r.text, r.updated_at) for r in before.requirements]
        initial_modified = before.updated_at
    result = client.get(f"/opportunities/{item_id}/evidence-match-preview")
    assert result.status_code == 200
    with factory() as session:
        after = session.get(Opportunity, item_id)
        assert after.updated_at == initial_modified
        assert [(r.id, r.text, r.updated_at) for r in after.requirements] == original
