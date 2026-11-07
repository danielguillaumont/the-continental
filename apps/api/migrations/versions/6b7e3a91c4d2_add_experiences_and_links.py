"""Add structured experience records and independent project/evidence links.

Revision ID: 6b7e3a91c4d2
Revises: 8d2e7af4c9b1
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "6b7e3a91c4d2"
down_revision: Union[str, Sequence[str], None] = "8d2e7af4c9b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Additive: nothing about existing evidence, projects or skills is changed.
    op.create_table(
        "experiences",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization", sa.String(160), nullable=False),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("employment_type", sa.String(24), nullable=True),
        sa.Column("location", sa.String(160), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("highlights", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("end_date IS NULL OR start_date <= end_date", name="ck_experiences_date_order"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "experience_projects",
        sa.Column("experience_id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["experience_id"], ["experiences.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("experience_id", "project_id"),
    )
    op.create_table(
        "experience_evidence",
        sa.Column("experience_id", sa.UUID(), nullable=False),
        sa.Column("evidence_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["experience_id"], ["experiences.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["evidence_id"], ["evidence.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("experience_id", "evidence_id"),
    )


def downgrade() -> None:
    # Data-destructive for new experiences; never run on important user data.
    op.drop_table("experience_evidence")
    op.drop_table("experience_projects")
    op.drop_table("experiences")
