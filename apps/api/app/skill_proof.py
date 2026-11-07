"""Evidence-derived skill inventory; deliberately no skill CRUD or confidence scores."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_database_session
from app.models import Evidence, Skill
from app.skill_schemas import SkillDetailRead, SkillEvidenceRead, SkillSummaryRead

router = APIRouter(prefix="/skills", tags=["Skills & Proof"])


def skill_summary(skill: Skill) -> SkillSummaryRead:
    total = len(skill.evidence_items)
    verified = sum(item.status == "verified" for item in skill.evidence_items)
    coverage = "verified" if verified else "unverified" if total else "unsupported"
    return SkillSummaryRead(
        id=skill.id,
        name=skill.name,
        normalizedName=skill.normalized_name,
        evidenceCount=total,
        verifiedCount=verified,
        unverifiedCount=total - verified,
        coverage=coverage,
    )


def skill_evidence(item: Evidence) -> SkillEvidenceRead:
    return SkillEvidenceRead(
        id=item.id,
        title=item.title,
        kind=item.kind,
        description=item.description,
        status=item.status,
        sourceLabel=item.source_label,
        sourceUrl=item.source_url,
        occurredAt=item.occurred_at,
        createdAt=item.created_at,
        updatedAt=item.updated_at,
    )


@router.get("", response_model=list[SkillSummaryRead])
def list_skills(
    session: Session = Depends(get_database_session),
) -> list[SkillSummaryRead]:
    # A skill can remain after its final evidence relationship is removed.
    # Preserve and expose that honest gap rather than silently removing the skill.
    skills = session.scalars(
        select(Skill)
        .options(selectinload(Skill.evidence_items))
        .order_by(Skill.normalized_name, Skill.id)
    ).all()
    return [skill_summary(item) for item in skills]


@router.get("/{skill_id}", response_model=SkillDetailRead)
def get_skill(
    skill_id: UUID,
    session: Session = Depends(get_database_session),
) -> SkillDetailRead:
    skill = session.scalar(
        select(Skill)
        .options(selectinload(Skill.evidence_items))
        .where(Skill.id == skill_id)
    )
    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found.",
        )

    evidence_items = sorted(
        skill.evidence_items,
        key=lambda item: (item.created_at, str(item.id)),
        reverse=True,
    )
    return SkillDetailRead(
        **skill_summary(skill).model_dump(),
        evidence=[skill_evidence(item) for item in evidence_items],
    )
