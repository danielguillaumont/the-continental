"""Add source-preserving Dossier opportunity and requirement records.

Revision ID: e42d1c8b90a7
Revises: b7c2e49a1d03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e42d1c8b90a7"
down_revision: Union[str, Sequence[str], None] = "b7c2e49a1d03"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Additive only. Existing v0.1 tables and relationships are untouched.
    op.create_table(
        "opportunities",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("company", sa.String(160), nullable=True),
        sa.Column("location", sa.String(200), nullable=True),
        sa.Column("employment_type", sa.String(60), nullable=True),
        sa.Column("salary_text", sa.String(240), nullable=True),
        sa.Column("technologies", sa.JSON(), nullable=False),
        sa.Column("extraction_provider", sa.String(80), nullable=True),
        sa.Column("extraction_model", sa.String(120), nullable=True),
        sa.Column("extraction_prompt_version", sa.String(80), nullable=True),
        sa.Column(
            "extraction_status", sa.String(16), nullable=False,
            server_default="not_run",
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "requirements",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("opportunity_id", sa.UUID(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("source_excerpt", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "kind IN ('required', 'preferred')", name="ck_requirements_kind",
        ),
        sa.CheckConstraint("position >= 0", name="ck_requirements_position"),
        sa.ForeignKeyConstraint(
            ["opportunity_id"], ["opportunities.id"], ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_requirements_opportunity_id", "requirements", ["opportunity_id"],
    )


def downgrade() -> None:
    # Destructive for new v0.2 records. Never downgrade important data.
    op.drop_index("ix_requirements_opportunity_id", table_name="requirements")
    op.drop_table("requirements")
    op.drop_table("opportunities")
