"""Add single-user career profile without altering existing evidence.

Revision ID: b7c2e49a1d03
Revises: 9f4c2e71b6a8
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "b7c2e49a1d03"
down_revision: Union[str, Sequence[str], None] = "9f4c2e71b6a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Additive: no changes to evidence, projects, experiences, skills or credentials.
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("full_name", sa.String(160), nullable=False),
        sa.Column("headline", sa.String(200), nullable=True),
        sa.Column("professional_summary", sa.Text(), nullable=True),
        sa.Column("location", sa.String(160), nullable=True),
        sa.Column("email", sa.String(254), nullable=True),
        sa.Column("phone", sa.String(40), nullable=True),
        sa.Column("website_url", sa.Text(), nullable=True),
        sa.Column("github_url", sa.Text(), nullable=True),
        sa.Column("linkedin_url", sa.Text(), nullable=True),
        sa.Column("target_roles", sa.JSON(), nullable=False),
        sa.Column("available_from", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.CheckConstraint("id = 1", name="ck_profiles_singleton"),
    )


def downgrade() -> None:
    # Destructive for profile data: NEVER run on an important database.
    op.drop_table("profiles")
