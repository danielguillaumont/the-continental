from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


evidence_skills = Table(
    "evidence_skills",
    Base.metadata,
    Column(
        "evidence_id",
        PGUUID(as_uuid=True),
        ForeignKey("evidence.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "skill_id",
        PGUUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    normalized_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        unique=True,
        index=True,
    )

    evidence_items: Mapped[list["Evidence"]] = relationship(
        secondary=evidence_skills,
        back_populates="skills",
    )


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    kind: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(160),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    skills: Mapped[list[Skill]] = relationship(
        secondary=evidence_skills,
        back_populates="evidence_items",
        lazy="selectin",
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="unverified",
    )

    source_label: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    source_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    occurred_at: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )