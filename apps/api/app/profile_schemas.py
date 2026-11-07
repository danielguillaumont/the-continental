"""Owner-entered career profile; not a claim of third-party verification."""

from datetime import date, datetime
import re

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class ProfileWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fullName: str = Field(min_length=2, max_length=160)
    headline: str | None = Field(default=None, max_length=200)
    professionalSummary: str | None = Field(default=None, max_length=4000)
    location: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=254)
    phone: str | None = Field(default=None, max_length=40)
    websiteUrl: HttpUrl | None = None
    githubUrl: HttpUrl | None = None
    linkedinUrl: HttpUrl | None = None
    targetRoles: list[str] = Field(default_factory=list, max_length=12)
    availableFrom: date | None = None

    @field_validator("fullName", "headline", "professionalSummary", "location", "email", "phone", mode="before")
    @classmethod
    def trim_strings(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        return value.strip()

    @field_validator("headline", "professionalSummary", "location", "email", "phone")
    @classmethod
    def empty_optional_is_null(cls, value: str | None) -> str | None:
        return value or None

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, value: str | None) -> str | None:
        if value is not None and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Enter an email address with a domain.")
        return value

    @field_validator("targetRoles")
    @classmethod
    def normalize_target_roles(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for value in values:
            name = value.strip()
            if not name or len(name) > 120:
                raise ValueError("Each target role must contain 1–120 nonblank characters.")
            key = name.casefold()
            if key not in seen:
                normalized.append(name)
                seen.add(key)
        return normalized


class ProfileRead(BaseModel):
    fullName: str
    headline: str | None
    professionalSummary: str | None
    location: str | None
    email: str | None
    phone: str | None
    websiteUrl: str | None
    githubUrl: str | None
    linkedinUrl: str | None
    targetRoles: list[str]
    availableFrom: date | None
    createdAt: datetime
    updatedAt: datetime
