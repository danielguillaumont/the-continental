"""v0.3 Evidence Match: conservative, read-only skill-tag candidate discovery.

A shared skill tag is only an invitation to inspect supporting evidence; it
is not proof of a qualification, a proficiency score, or a hiring decision.
"""

import re
from collections import defaultdict
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_database_session
from app.models import Evidence, Opportunity, Skill

router = APIRouter(prefix="/opportunities", tags=["Evidence Match / Preview"])

# Keep the preview intentionally bounded and deterministic. A future reviewer
# workflow can page through more candidates rather than silently scoring them.
MAX_CANDIDATES_PER_REQUIREMENT = 25


class MatchedSkill(BaseModel):
    id: UUID
    name: str
    requirementPhrase: str


class LinkedProject(BaseModel):
    id: UUID
    name: str


class LinkedExperience(BaseModel):
    id: UUID
    title: str
    organization: str


class EvidenceCandidate(BaseModel):
    id: UUID
    title: str
    kind: str
    ownerStatus: Literal["verified", "unverified"]
    sourceLabel: str | None
    sourceUrl: str | None
    matchedSkillIds: list[UUID]
    projects: list[LinkedProject]
    experiences: list[LinkedExperience]


class RequirementMatch(BaseModel):
    id: UUID
    text: str
    kind: Literal["required", "preferred"]
    outcome: Literal[
        "candidates_found", "no_linked_evidence", "no_explicit_skill_tag",
    ]
    matchedSkills: list[MatchedSkill]
    evidenceCandidates: list[EvidenceCandidate]
    candidateCount: int
    truncated: bool


class MatchSummary(BaseModel):
    totalRequirements: int
    candidatesFound: int
    noLinkedEvidence: int
    noExplicitSkillTag: int


class EvidenceMatchPreview(BaseModel):
    schemaVersion: Literal["continental.v03.evidence-match.v1"] = (
        "continental.v03.evidence-match.v1"
    )
    mode: Literal["deterministic_explicit_skill_tags"] = (
        "deterministic_explicit_skill_tags"
    )
    opportunityId: UUID
    opportunityTitle: str | None
    summary: MatchSummary
    requirements: list[RequirementMatch]
    caveat: str = (
        "Candidate evidence is found through literal skill tags only. "
        "No qualification, proficiency, job fit, or third-party verification is inferred. "
        "A human must inspect the original evidence and source links."
    )


def find_literal_skill(text: str, skill_name: str) -> str | None:
    """Return the requirement's own substring if the complete tag is present.

    Token boundaries prevent matching Go inside Django or AWS inside AWSome.
    Very short names require exact case because ordinary words such as 'go'
    should not be treated as technical qualifications.
    """
    name = skill_name.strip()
    if not name:
        return None
    expr = re.escape(name).replace(r"\ ", r"\s+")
    # Also prevent partial technical tokens such as .NET in .NETCore.
    pattern = rf"(?<![\w]){expr}(?![\w])"
    flags = 0 if len(name) <= 2 else re.IGNORECASE
    match = re.search(pattern, text, flags)
    return match.group(0) if match else None


def build_preview(opportunity: Opportunity, skills: list[Skill]) -> EvidenceMatchPreview:
    """Pure projection over loaded ORM models; no writes or model inference."""
    results: list[RequirementMatch] = []
    ordered_skills = sorted(skills, key=lambda skill: (skill.normalized_name, str(skill.id)))
    requirements = sorted(
        opportunity.requirements,
        key=lambda requirement: (requirement.position, str(requirement.id)),
    )

    for requirement in requirements:
        matched = []
        candidates_by_id: dict[UUID, Evidence] = {}
        candidate_skills: dict[UUID, set[UUID]] = defaultdict(set)

        for skill in ordered_skills:
            phrase = find_literal_skill(requirement.text, skill.name)
            if phrase is None:
                continue
            matched.append(MatchedSkill(id=skill.id, name=skill.name, requirementPhrase=phrase))
            for evidence in skill.evidence_items:
                candidates_by_id[evidence.id] = evidence
                candidate_skills[evidence.id].add(skill.id)

        ordered_candidates = sorted(
            candidates_by_id.values(),
            key=lambda evidence: (evidence.title.casefold(), str(evidence.id)),
        )
        candidate_count = len(ordered_candidates)
        output_candidates = []
        for evidence in ordered_candidates[:MAX_CANDIDATES_PER_REQUIREMENT]:
            projects = sorted(evidence.projects, key=lambda item: (item.name.casefold(), str(item.id)))
            experiences = sorted(
                evidence.experiences,
                key=lambda item: (item.title.casefold(), item.organization.casefold(), str(item.id)),
            )
            output_candidates.append(EvidenceCandidate(
                id=evidence.id, title=evidence.title, kind=evidence.kind,
                ownerStatus=evidence.status, sourceLabel=evidence.source_label,
                sourceUrl=evidence.source_url,
                matchedSkillIds=sorted(candidate_skills[evidence.id], key=str),
                projects=[LinkedProject(id=item.id, name=item.name) for item in projects],
                experiences=[
                    LinkedExperience(id=item.id, title=item.title, organization=item.organization)
                    for item in experiences
                ],
            ))

        outcome = (
            "candidates_found" if candidate_count else
            "no_linked_evidence" if matched else
            "no_explicit_skill_tag"
        )
        results.append(RequirementMatch(
            id=requirement.id, text=requirement.text, kind=requirement.kind,
            outcome=outcome, matchedSkills=matched,
            evidenceCandidates=output_candidates, candidateCount=candidate_count,
            truncated=candidate_count > MAX_CANDIDATES_PER_REQUIREMENT,
        ))

    return EvidenceMatchPreview(
        opportunityId=opportunity.id,
        opportunityTitle=opportunity.title,
        summary=MatchSummary(
            totalRequirements=len(results),
            candidatesFound=sum(item.outcome == "candidates_found" for item in results),
            noLinkedEvidence=sum(item.outcome == "no_linked_evidence" for item in results),
            noExplicitSkillTag=sum(item.outcome == "no_explicit_skill_tag" for item in results),
        ),
        requirements=results,
    )


@router.get("/{opportunity_id}/evidence-match-preview", response_model=EvidenceMatchPreview)
def preview_evidence_match(
    opportunity_id: UUID, session: Session = Depends(get_database_session),
) -> EvidenceMatchPreview:
    opportunity = session.get(Opportunity, opportunity_id)
    if opportunity is None:
        raise HTTPException(status_code=404, detail="Opportunity not found.")
    skills = session.scalars(select(Skill).options(
        selectinload(Skill.evidence_items).selectinload(Evidence.projects),
        selectinload(Skill.evidence_items).selectinload(Evidence.experiences),
    )).all()
    return build_preview(opportunity, list(skills))
