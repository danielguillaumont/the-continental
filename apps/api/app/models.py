from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    JSON,
    CheckConstraint,
    ForeignKey,
    String,
    UniqueConstraint,
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


project_evidence = Table(
    "project_evidence",
    Base.metadata,
    Column(
        "project_id",
        PGUUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "evidence_id",
        PGUUID(as_uuid=True),
        ForeignKey("evidence.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


experience_projects = Table(
    "experience_projects",
    Base.metadata,
    Column(
        "experience_id", PGUUID(as_uuid=True),
        ForeignKey("experiences.id", ondelete="CASCADE"), primary_key=True,
    ),
    Column(
        "project_id", PGUUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True,
    ),
)

experience_evidence = Table(
    "experience_evidence",
    Base.metadata,
    Column(
        "experience_id", PGUUID(as_uuid=True),
        ForeignKey("experiences.id", ondelete="CASCADE"), primary_key=True,
    ),
    Column(
        "evidence_id", PGUUID(as_uuid=True),
        ForeignKey("evidence.id", ondelete="CASCADE"), primary_key=True,
    ),
)


certification_skills = Table(
    "certification_skills",
    Base.metadata,
    Column("certification_id", PGUUID(as_uuid=True),
           ForeignKey("certifications.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", PGUUID(as_uuid=True),
           ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
)

certification_evidence = Table(
    "certification_evidence",
    Base.metadata,
    Column("certification_id", PGUUID(as_uuid=True),
           ForeignKey("certifications.id", ondelete="CASCADE"), primary_key=True),
    Column("evidence_id", PGUUID(as_uuid=True),
           ForeignKey("evidence.id", ondelete="CASCADE"), primary_key=True),
)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    repository_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    evidence_items: Mapped[list["Evidence"]] = relationship(
        secondary=project_evidence,
        back_populates="projects",
        lazy="selectin",
        order_by="Evidence.created_at",
    )

    experiences: Mapped[list["Experience"]] = relationship(
        secondary=experience_projects, back_populates="projects",
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
    certifications: Mapped[list["Certification"]] = relationship(
        secondary=certification_skills, back_populates="skills",
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

    projects: Mapped[list[Project]] = relationship(
        secondary=project_evidence,
        back_populates="evidence_items",
    )

    experiences: Mapped[list["Experience"]] = relationship(
        secondary=experience_evidence, back_populates="evidence_items",
    )
    certifications: Mapped[list["Certification"]] = relationship(
        secondary=certification_evidence, back_populates="evidence_items",
    )


class Experience(Base):
    """An employment/engagement record, independent of supporting evidence."""

    __tablename__ = "experiences"
    __table_args__ = (
        CheckConstraint(
            "end_date IS NULL OR start_date <= end_date",
            name="ck_experiences_date_order",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4,
    )
    organization: Mapped[str] = mapped_column(String(160), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    employment_type: Mapped[str | None] = mapped_column(String(24), nullable=True)
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    highlights: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now(),
    )

    projects: Mapped[list[Project]] = relationship(
        secondary=experience_projects, back_populates="experiences", lazy="selectin",
        order_by="Project.created_at",
    )
    evidence_items: Mapped[list[Evidence]] = relationship(
        secondary=experience_evidence, back_populates="experiences", lazy="selectin",
        order_by="Evidence.created_at",
    )


class Certification(Base):
    """A separately managed credential, independent from supporting proof."""

    __tablename__ = "certifications"
    __table_args__ = (
        CheckConstraint(
            "issued_at IS NULL OR expires_at IS NULL OR issued_at <= expires_at",
            name="ck_certifications_date_order",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    issuer: Mapped[str] = mapped_column(String(160), nullable=False)
    credential_id: Mapped[str | None] = mapped_column(String(160), nullable=True)
    credential_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    issued_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    expires_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now(),
    )

    skills: Mapped[list[Skill]] = relationship(
        secondary=certification_skills, back_populates="certifications",
        lazy="selectin", order_by="Skill.normalized_name",
    )
    evidence_items: Mapped[list[Evidence]] = relationship(
        secondary=certification_evidence, back_populates="certifications",
        lazy="selectin", order_by="Evidence.created_at",
    )


class Profile(Base):
    """Single-user career identity; intentionally independent of career proof."""

    __tablename__ = "profiles"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_profiles_singleton"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    headline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    professional_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    website_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    github_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_roles: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    available_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )


class Opportunity(Base):
    """A saved job posting. The original text never changes during metadata edits."""

    __tablename__ = "opportunities"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4,
    )
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    company: Mapped[str | None] = mapped_column(String(160), nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    employment_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    salary_text: Mapped[str | None] = mapped_column(String(240), nullable=True)
    technologies: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    extraction_provider: Mapped[str | None] = mapped_column(String(80), nullable=True)
    extraction_model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    extraction_prompt_version: Mapped[str | None] = mapped_column(String(80), nullable=True)
    extraction_status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="not_run", server_default="not_run",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now(),
    )

    requirements: Mapped[list["Requirement"]] = relationship(
        back_populates="opportunity", cascade="all, delete-orphan",
        lazy="selectin", order_by="(Requirement.position, Requirement.id)",
    )
    attributions: Mapped[list["OpportunityAttribution"]] = relationship(
        back_populates="opportunity", cascade="all, delete-orphan",
        lazy="selectin", order_by="(OpportunityAttribution.created_at, OpportunityAttribution.id)",
    )


class Requirement(Base):
    """Individually editable extracted or manually entered job requirement."""

    __tablename__ = "requirements"
    __table_args__ = (
        CheckConstraint(
            "kind IN ('required', 'preferred')",
            name="ck_requirements_kind",
        ),
        CheckConstraint("position >= 0", name="ck_requirements_position"),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4,
    )
    opportunity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    position: Mapped[int] = mapped_column(nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    source_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now(),
    )

    opportunity: Mapped[Opportunity] = relationship(back_populates="requirements")


class OpportunityAttribution(Base):
    """Owner-approved source citation for an applied metadata field or technology.

    This records evidence of a string in the immutable posting, not independent
    verification and not a claim about which AI model produced a suggestion.
    """

    __tablename__ = "opportunity_attributions"
    __table_args__ = (
        CheckConstraint(
            "kind IN ('metadata', 'technology')", name="ck_opportunity_attributions_kind",
        ),
        UniqueConstraint(
            "opportunity_id", "kind", "field_name", "value",
            name="uq_opportunity_attributions_target_value",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4,
    )
    opportunity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    field_name: Mapped[str] = mapped_column(String(32), nullable=False)
    value: Mapped[str] = mapped_column(String(240), nullable=False)
    source_excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    source_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )

    opportunity: Mapped[Opportunity] = relationship(back_populates="attributions")
