"""Add explicit owner-reviewed requirement-to-evidence decisions.

Revision ID: a1d8c4f60e32
Revises: d39b2a4f7c61
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1d8c4f60e32"
down_revision: Union[str, Sequence[str], None] = "d39b2a4f7c61"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Additive only; existing projects, evidence and Dossiers remain unchanged.
    op.create_table(
        "evidence_reviews",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("requirement_id", sa.UUID(), nullable=False),
        sa.Column("evidence_id", sa.UUID(), nullable=False),
        sa.Column("decision", sa.String(16), nullable=False),
        sa.Column("review_note", sa.Text(), nullable=False),
        sa.Column("snapshot_fingerprint", sa.String(64), nullable=False),
        sa.Column("requirement_text_snapshot", sa.Text(), nullable=False),
        sa.Column("evidence_title_snapshot", sa.String(160), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.CheckConstraint("decision IN ('supports', 'not_relevant')",
                           name="ck_evidence_reviews_decision"),
        sa.CheckConstraint("length(review_note) <= 1200",
                           name="ck_evidence_reviews_note_length"),
        sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"],
                                ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["evidence_id"], ["evidence.id"],
                                ondelete="CASCADE"),
        sa.UniqueConstraint("requirement_id", "evidence_id",
                            name="uq_evidence_reviews_pair"),
    )
    op.create_index("ix_evidence_reviews_requirement_id", "evidence_reviews", ["requirement_id"])
    op.create_index("ix_evidence_reviews_evidence_id", "evidence_reviews", ["evidence_id"])


def downgrade() -> None:
    # Destructive: removes stored review decisions. Do not downgrade without a backup.
    op.drop_index("ix_evidence_reviews_evidence_id", table_name="evidence_reviews")
    op.drop_index("ix_evidence_reviews_requirement_id", table_name="evidence_reviews")
    op.drop_table("evidence_reviews")
