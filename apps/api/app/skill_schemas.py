"""Read-only skill evidence projections. Skills originate in the Evidence workflow."""

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.schemas import EvidenceKind, EvidenceStatus


SkillCoverage = Literal["verified", "unverified", "unsupported"]


class SkillSummaryRead(BaseModel):
    id: UUID
    name: str
    normalizedName: str
    evidenceCount: int
    verifiedCount: int
    unverifiedCount: int
    coverage: SkillCoverage


class SkillEvidenceRead(BaseModel):
    id: UUID
    title: str
    kind: EvidenceKind
    description: str
    status: EvidenceStatus
    sourceLabel: str | None = None
    sourceUrl: str | None = None
    occurredAt: date | None = None
    createdAt: datetime
    updatedAt: datetime


class SkillDetailRead(SkillSummaryRead):
    evidence: list[SkillEvidenceRead]
