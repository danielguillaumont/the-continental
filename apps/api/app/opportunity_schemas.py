"""Dossier opportunity contracts. Values are owner-entered until extraction exists."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class OpportunityWrite(BaseModel):
    """Editable metadata. Original source text is deliberately not writable here."""

    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, max_length=200)
    company: str | None = Field(default=None, max_length=160)
    location: str | None = Field(default=None, max_length=200)
    employmentType: str | None = Field(default=None, max_length=60)
    salaryText: str | None = Field(default=None, max_length=240)
    sourceUrl: HttpUrl | None = None
    technologies: list[str] = Field(default_factory=list, max_length=40)

    @field_validator("title", "company", "location", "employmentType", "salaryText", mode="before")
    @classmethod
    def strip_optional(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        return value.strip() or None

    @field_validator("sourceUrl")
    @classmethod
    def no_url_credentials(cls, value: HttpUrl | None) -> HttpUrl | None:
        if value is not None and (value.username is not None or value.password is not None):
            raise ValueError("Source URL must not contain embedded credentials.")
        return value

    @field_validator("technologies")
    @classmethod
    def clean_technologies(cls, values: list[str]) -> list[str]:
        unique: list[str] = []
        seen: set[str] = set()
        for value in values:
            if not isinstance(value, str):
                raise ValueError("Technologies must be strings.")
            name = value.strip()
            if not 1 <= len(name) <= 100:
                raise ValueError("Technologies must contain 1-100 visible characters.")
            key = name.casefold()
            if key not in seen:
                unique.append(name)
                seen.add(key)
        return unique


class OpportunityCreate(OpportunityWrite):
    # The immutable original is provided on initial creation, never in PUT.
    sourceText: str = Field(min_length=20, max_length=100_000)

    @field_validator("sourceText")
    @classmethod
    def nonblank_source(cls, text: str) -> str:
        if not text.strip():
            raise ValueError("Original job text cannot be blank.")
        # Never strip or normalize source text: original byte-equivalent content
        # (as submitted as a JSON string) remains inspectable.
        return text


class RequirementWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=2, max_length=2000)
    kind: Literal["required", "preferred"]
    sourceExcerpt: str | None = Field(default=None, max_length=2000)

    @field_validator("text", "sourceExcerpt", mode="before")
    @classmethod
    def strip_fields(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        return value.strip()

    @field_validator("text")
    @classmethod
    def nonblank_text(cls, value: str) -> str:
        if not value:
            raise ValueError("Requirement description cannot be blank.")
        return value

    @field_validator("sourceExcerpt")
    @classmethod
    def blank_excerpt_is_null(cls, value: str | None) -> str | None:
        return value or None


class RequirementRead(RequirementWrite):
    id: UUID
    position: int
    createdAt: datetime
    updatedAt: datetime


class OpportunityAttributionRead(BaseModel):
    """Citation retained for a specifically approved value; not AI verification."""

    id: UUID
    kind: Literal["metadata", "technology"]
    field: str
    value: str
    sourceExcerpt: str
    sourceSha256: str
    createdAt: datetime


class OpportunityRead(OpportunityWrite):
    id: UUID
    sourceText: str
    # Empty extraction metadata means this is only a raw/manual record.
    extractionProvider: str | None
    extractionModel: str | None
    extractionPromptVersion: str | None
    extractionStatus: Literal["not_run", "completed", "failed"]
    requirements: list[RequirementRead]
    attributions: list[OpportunityAttributionRead]
    createdAt: datetime
    updatedAt: datetime
