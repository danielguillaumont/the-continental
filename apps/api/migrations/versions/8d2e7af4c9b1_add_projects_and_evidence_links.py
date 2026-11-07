"""add projects and their evidence links (data preserving)

Revision ID: 8d2e7af4c9b1
Revises: 1c496c7b1d73
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "8d2e7af4c9b1"
down_revision: Union[str, Sequence[str], None] = "1c496c7b1d73"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("repository_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "project_evidence",
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("evidence_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["evidence_id"], ["evidence.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("project_id", "evidence_id"),
    )


def downgrade() -> None:
    # Downgrading drops newly created project records and links.
    # Never run downgrade against an important database without a backup.
    op.drop_table("project_evidence")
    op.drop_table("projects")
