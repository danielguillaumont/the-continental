"""Independent credentials: links and owner-entered details are not third-party verification."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, ValidationInfo, field_validator, model_validator


class CertificationWrite(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    issuer: str = Field(min_length=2, max_length=160)
    credentialId: str | None = Field(default=None, max_length=160)
    credentialUrl: HttpUrl | None = None
    issuedAt: date | None = None
    expiresAt: date | None = None
    description: str | None = Field(default=None, max_length=2000)

    @field_validator("name", "issuer", "credentialId", "description")
    @classmethod
    def clean_text(cls, value: str | None, info: ValidationInfo) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if info.field_name in {"name", "issuer"} and len(cleaned) < 2:
            raise ValueError("A meaningful name and issuer are required.")
        return cleaned or None

    @model_validator(mode="after")
    def check_dates(self):
        if self.issuedAt and self.expiresAt and self.expiresAt < self.issuedAt:
            raise ValueError("Expiration must not precede issue date.")
        return self


class CertificationSkillRead(BaseModel):
    id: UUID
    name: str


class CertificationEvidenceRead(BaseModel):
    id: UUID
    title: str
    kind: str
    status: str


class CertificationRead(BaseModel):
    id: UUID
    name: str
    issuer: str
    credentialId: str | None = None
    credentialUrl: str | None = None
    issuedAt: date | None = None
    expiresAt: date | None = None
    description: str | None = None
    skills: list[CertificationSkillRead]
    evidence: list[CertificationEvidenceRead]
    createdAt: datetime
    updatedAt: datetime
