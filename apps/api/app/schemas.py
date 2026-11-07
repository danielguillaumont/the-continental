from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, ValidationInfo, field_validator, model_validator


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


class EvidenceWrite(BaseModel):
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


class EvidenceCreate(EvidenceWrite):
    pass


class EvidenceUpdate(EvidenceWrite):
    pass


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

ProjectStatus = Literal["active", "completed", "paused"]


class ProjectWrite(BaseModel):
    name: str = Field(min_length=3, max_length=160)
    summary: str = Field(min_length=10, max_length=2000)
    repositoryUrl: HttpUrl | None = None
    status: ProjectStatus = "active"

    @field_validator("name", "summary")
    @classmethod
    def normalize_project_text(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("A meaningful value is required.")
        return cleaned


class ProjectEvidenceRead(BaseModel):
    id: UUID
    title: str
    kind: EvidenceKind
    status: EvidenceStatus


class ProjectRead(BaseModel):
    id: UUID
    name: str
    summary: str
    repositoryUrl: str | None = None
    status: ProjectStatus
    evidence: list[ProjectEvidenceRead]
    createdAt: datetime
    updatedAt: datetime


# A career experience is a durable role/engagement record, not an Evidence item
# with kind="experience". Its projects and evidence remain independent records.
EmploymentType = Literal[
    "full_time", "part_time", "contract", "internship",
    "freelance", "volunteer", "other",
]


class ExperienceWrite(BaseModel):
    organization: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=160)
    employmentType: EmploymentType | None = None
    location: str | None = Field(default=None, max_length=160)
    startDate: date
    endDate: date | None = None
    description: str = Field(min_length=10, max_length=3000)
    highlights: list[str] = Field(default_factory=list, max_length=12)

    @field_validator("organization", "title", "description")
    @classmethod
    def meaningful_text(cls, value: str, info: ValidationInfo) -> str:
        clean = value.strip()
        minimum = 10 if info.field_name == "description" else 1
        if len(clean) < minimum:
            raise ValueError("A meaningful value is required.")
        return clean

    @field_validator("location")
    @classmethod
    def optional_location(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @field_validator("highlights")
    @classmethod
    def normalize_highlights(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for value in values:
            text = value.strip()
            if len(text) < 3 or len(text) > 300:
                raise ValueError("Each accomplishment must be 3–300 characters.")
            key = text.casefold()
            if key in seen:
                raise ValueError("Duplicate accomplishments are not allowed.")
            seen.add(key)
            cleaned.append(text)
        return cleaned

    @model_validator(mode="after")
    def date_order(self):
        if self.endDate is not None and self.endDate < self.startDate:
            raise ValueError("End date must not precede start date.")
        return self


class ExperienceProjectRead(BaseModel):
    id: UUID
    name: str
    status: ProjectStatus


class ExperienceRead(ExperienceWrite):
    id: UUID
    projects: list[ExperienceProjectRead]
    evidence: list[ProjectEvidenceRead]
    createdAt: datetime
    updatedAt: datetime
