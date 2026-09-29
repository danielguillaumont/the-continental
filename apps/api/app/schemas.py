from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, field_validator


EvidenceKind = Literal[
    "project",
    "experience",
    "certification",
    "education",
    "artifact",
]

EvidenceStatus = Literal[
    "verified",
    "unverified",
]


class EvidenceSource(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    url: HttpUrl | None = None


class EvidenceCreate(BaseModel):
    kind: EvidenceKind
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=2000)
    skills: list[str] = Field(min_length=1)
    status: EvidenceStatus = "unverified"
    source: EvidenceSource | None = None
    occurredAt: date | None = None

    @field_validator("skills")
    @classmethod
    def normalize_skills(cls, skills: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()

        for skill in skills:
            cleaned = skill.strip()

            if not cleaned:
                continue

            key = cleaned.casefold()

            if key not in seen:
                normalized.append(cleaned)
                seen.add(key)

        if not normalized:
            raise ValueError("At least one skill is required.")

        return normalized


class EvidenceRead(BaseModel):
    id: UUID
    kind: EvidenceKind
    title: str
    description: str
    skills: list[str]
    status: EvidenceStatus
    source: EvidenceSource | None = None
    occurredAt: date | None = None
    createdAt: datetime
    updatedAt: datetime


class EvidenceValidationResponse(BaseModel):
    valid: Literal[True] = True
    evidence: EvidenceCreate