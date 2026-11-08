"""Retain owner-approved Dossier metadata and technology source citations.

Revision ID: d39b2a4f7c61
Revises: e42d1c8b90a7
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d39b2a4f7c61"
down_revision: Union[str, Sequence[str], None] = "e42d1c8b90a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Additive: no existing opportunity, requirement, or career record changes.
    # Older approved values cannot be reliably retroactively cited; leave them
    # uncited instead of guessing an excerpt or model provenance.
    op.create_table(
        "opportunity_attributions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("opportunity_id", sa.UUID(), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("field_name", sa.String(32), nullable=False),
        sa.Column("value", sa.String(240), nullable=False),
        sa.Column("source_excerpt", sa.Text(), nullable=False),
        sa.Column("source_sha256", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.CheckConstraint("kind IN ('metadata', 'technology')",
                           name="ck_opportunity_attributions_kind"),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"],
                                ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("opportunity_id", "kind", "field_name", "value",
                            name="uq_opportunity_attributions_target_value"),
    )
    op.create_index("ix_opportunity_attributions_opportunity_id",
                    "opportunity_attributions", ["opportunity_id"])


def downgrade() -> None:
    # Destructive: deletes permanently stored citations. Never downgrade user data
    # casually; back up before any schema change.
    op.drop_index("ix_opportunity_attributions_opportunity_id",
                  table_name="opportunity_attributions")
    op.drop_table("opportunity_attributions")
