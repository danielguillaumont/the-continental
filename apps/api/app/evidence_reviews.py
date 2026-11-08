"""v0.3D1: explicit owner-reviewed requirement/evidence associations.

A review is not an independent verification of a credential, qualification, or fit.
If source material changes, the persisted decision remains visible but goes stale.
"""

import hashlib
import json
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_database_session
from app.evidence_match import build_preview, find_literal_skill
from app.models import Evidence, EvidenceReview, Opportunity, Requirement, Skill

router = APIRouter(prefix="/opportunities", tags=["Evidence Match / Review"])


class ReviewWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    decision: Literal["supports", "not_relevant"]
    note: str = Field(max_length=1200)
    expectedFingerprint: str = Field(pattern=r"^[a-f0-9]{64}$")

    @field_validator("note")
    @classmethod
    def clean_note(cls, note: str) -> str:
        return note.strip()

    @model_validator(mode="after")
    def require_explanation(self) -> "ReviewWrite":
        if self.decision == "supports" and len(self.note) < 10:
            raise ValueError("Supporting evidence requires a note of at least 10 characters.")
        return self


class ReviewRead(BaseModel):
    id: UUID
    requirementId: UUID
    evidenceId: UUID
    decision: Literal["supports", "not_relevant"]
    note: str
    requirementTextAtReview: str
    evidenceTitleAtReview: str
    reviewStatus: Literal["current", "stale"]
    currentCandidate: bool
    createdAt: str
    updatedAt: str


class CandidateReviewOption(BaseModel):
    requirementId: UUID
    evidenceId: UUID
    evidenceTitle: str
    fingerprint: str
    currentReview: ReviewRead | None


class ReviewOptions(BaseModel):
    schemaVersion: Literal["continental.v03.review-options.v1"] = (
        "continental.v03.review-options.v1"
    )
    opportunityId: UUID
    candidates: list[CandidateReviewOption]
    truncatedRequirementIds: list[UUID]
    caveat: str = (
        "A review records the owner's judgment only; it does not independently "
        "verify evidence or establish qualification or job fit."
    )


class ReviewsRead(BaseModel):
    schemaVersion: Literal["continental.v03.reviews.v1"] = (
        "continental.v03.reviews.v1"
    )
    opportunityId: UUID
    reviews: list[ReviewRead]


def review_candidate(requirement: Requirement, evidence: Evidence) -> bool:
    return any(find_literal_skill(requirement.text, skill.name) is not None
               for skill in evidence.skills)


def current_fingerprint(requirement: Requirement, evidence: Evidence) -> str:
    """Stable fingerprint over material reviewed; excludes volatile timestamps."""
    value = {
        "requirement": [requirement.text, requirement.kind],
        "evidence": [
            evidence.title, evidence.kind, evidence.description, evidence.status,
            evidence.source_label, evidence.source_url,
            sorted((skill.name for skill in evidence.skills), key=str.casefold),
            evidence.occurred_at.isoformat() if evidence.occurred_at else None,
            sorted(str(project.id) for project in evidence.projects),
            sorted(str(experience.id) for experience in evidence.experiences),
        ],
    }
    canonical = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def load_opportunity(session: Session, opportunity_id: UUID) -> Opportunity:
    result = session.get(Opportunity, opportunity_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Opportunity not found.")
    return result


def load_requirement(session: Session, opportunity_id: UUID, requirement_id: UUID) -> Requirement:
    result = session.scalar(select(Requirement).where(
        Requirement.id == requirement_id, Requirement.opportunity_id == opportunity_id,
    ))
    if result is None:
        raise HTTPException(status_code=404, detail="Requirement not found in this Dossier.")
    return result


def load_evidence(session: Session, evidence_id: UUID) -> Evidence:
    result = session.get(Evidence, evidence_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Evidence record not found.")
    return result


def get_reviews(session: Session, opportunity_id: UUID) -> list[EvidenceReview]:
    return list(session.scalars(
        select(EvidenceReview).join(Requirement).where(
            Requirement.opportunity_id == opportunity_id,
        ).options(
            selectinload(EvidenceReview.requirement),
            selectinload(EvidenceReview.evidence).selectinload(Evidence.skills),
        ).order_by(Requirement.position, EvidenceReview.id)
    ).all())


def review_to_read(row: EvidenceReview) -> ReviewRead:
    candidate = review_candidate(row.requirement, row.evidence)
    fresh = candidate and row.snapshot_fingerprint == current_fingerprint(
        row.requirement, row.evidence,
    )
    return ReviewRead(
        id=row.id, requirementId=row.requirement_id, evidenceId=row.evidence_id,
        decision=row.decision, note=row.review_note,
        requirementTextAtReview=row.requirement_text_snapshot,
        evidenceTitleAtReview=row.evidence_title_snapshot,
        reviewStatus="current" if fresh else "stale", currentCandidate=candidate,
        createdAt=row.created_at.isoformat(), updatedAt=row.updated_at.isoformat(),
    )


@router.get("/{opportunity_id}/evidence-review-options", response_model=ReviewOptions)
def review_options(
    opportunity_id: UUID, session: Session = Depends(get_database_session),
) -> ReviewOptions:
    opportunity = load_opportunity(session, opportunity_id)
    skills = session.scalars(select(Skill).options(
        selectinload(Skill.evidence_items).selectinload(Evidence.projects),
        selectinload(Skill.evidence_items).selectinload(Evidence.experiences),
    )).all()
    preview = build_preview(opportunity, list(skills))
    reviews = {(row.requirement_id, row.evidence_id): row
               for row in get_reviews(session, opportunity_id)}
    requirements = {item.id: item for item in opportunity.requirements}
    candidates: list[CandidateReviewOption] = []
    for requirement in preview.requirements:
        model = requirements[requirement.id]
        for candidate in requirement.evidenceCandidates:
            evidence = load_evidence(session, candidate.id)
            row = reviews.get((model.id, evidence.id))
            candidates.append(CandidateReviewOption(
                requirementId=model.id, evidenceId=evidence.id,
                evidenceTitle=evidence.title,
                fingerprint=current_fingerprint(model, evidence),
                currentReview=review_to_read(row) if row else None,
            ))
    return ReviewOptions(
        opportunityId=opportunity_id, candidates=candidates,
        truncatedRequirementIds=[item.id for item in preview.requirements if item.truncated],
    )


@router.get("/{opportunity_id}/evidence-reviews", response_model=ReviewsRead)
def list_reviews(
    opportunity_id: UUID, session: Session = Depends(get_database_session),
) -> ReviewsRead:
    load_opportunity(session, opportunity_id)
    return ReviewsRead(opportunityId=opportunity_id,
                       reviews=[review_to_read(row) for row in get_reviews(session, opportunity_id)])


@router.put(
    "/{opportunity_id}/requirements/{requirement_id}/evidence-reviews/{evidence_id}",
    response_model=ReviewRead,
)
def save_review(
    opportunity_id: UUID, requirement_id: UUID, evidence_id: UUID,
    payload: ReviewWrite, session: Session = Depends(get_database_session),
) -> ReviewRead:
    requirement = load_requirement(session, opportunity_id, requirement_id)
    evidence = load_evidence(session, evidence_id)
    if not review_candidate(requirement, evidence):
        raise HTTPException(status_code=409, detail=(
            "This evidence is not a current explicit-skill candidate. "
            "Refresh the match preview before reviewing."
        ))
    fingerprint = current_fingerprint(requirement, evidence)
    if payload.expectedFingerprint != fingerprint:
        raise HTTPException(status_code=409, detail=(
            "The requirement or evidence changed. Refresh before saving a review."
        ))
    row = session.scalar(select(EvidenceReview).where(
        EvidenceReview.requirement_id == requirement_id,
        EvidenceReview.evidence_id == evidence_id,
    ))
    if row is None:
        row = EvidenceReview(requirement_id=requirement_id, evidence_id=evidence_id)
        session.add(row)
    row.decision = payload.decision
    row.review_note = payload.note
    row.snapshot_fingerprint = fingerprint
    row.requirement_text_snapshot = requirement.text
    row.evidence_title_snapshot = evidence.title
    session.commit()
    session.refresh(row)
    return review_to_read(row)


@router.delete(
    "/{opportunity_id}/requirements/{requirement_id}/evidence-reviews/{evidence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_review(
    opportunity_id: UUID, requirement_id: UUID, evidence_id: UUID,
    session: Session = Depends(get_database_session),
) -> Response:
    load_requirement(session, opportunity_id, requirement_id)
    row = session.scalar(select(EvidenceReview).where(
        EvidenceReview.requirement_id == requirement_id,
        EvidenceReview.evidence_id == evidence_id,
    ))
    if row is None:
        raise HTTPException(status_code=404, detail="Review not found.")
    session.delete(row)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
