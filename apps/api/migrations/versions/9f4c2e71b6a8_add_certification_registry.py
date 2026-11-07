"""Add independent credential records and non-owning links to skills/evidence.

Revision ID: 9f4c2e71b6a8
Revises: 6b7e3a91c4d2
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "9f4c2e71b6a8"
down_revision: Union[str, Sequence[str], None] = "6b7e3a91c4d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Additive only: do not modify or backfill existing career records.
    op.create_table(
        "certifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("issuer", sa.String(160), nullable=False),
        sa.Column("credential_id", sa.String(160), nullable=True),
        sa.Column("credential_url", sa.Text(), nullable=True),
        sa.Column("issued_at", sa.Date(), nullable=True),
        sa.Column("expires_at", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.CheckConstraint(
            "issued_at IS NULL OR expires_at IS NULL OR issued_at <= expires_at",
            name="ck_certifications_date_order",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "certification_skills",
        sa.Column("certification_id", sa.UUID(), nullable=False),
        sa.Column("skill_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["certification_id"], ["certifications.id"],
                                ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"],
                                ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("certification_id", "skill_id"),
    )
    op.create_table(
        "certification_evidence",
        sa.Column("certification_id", sa.UUID(), nullable=False),
        sa.Column("evidence_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["certification_id"], ["certifications.id"],
                                ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["evidence_id"], ["evidence.id"],
                                ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("certification_id", "evidence_id"),
    )


def downgrade() -> None:
    # Destructive for new certification data. Never run on important user data.
    op.drop_table("certification_evidence")
    op.drop_table("certification_skills")
    op.drop_table("certifications")
