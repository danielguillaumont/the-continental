"""normalize skill relationships

Revision ID: 1c496c7b1d73
Revises: 37b79afbb0a5
Create Date: 2026-10-13 15:56:56.036889
"""

from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "1c496c7b1d73"
down_revision: Union[str, Sequence[str], None] = "37b79afbb0a5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "skills",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "name",
            sa.String(length=120),
            nullable=False,
        ),
        sa.Column(
            "normalized_name",
            sa.String(length=120),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_skills_normalized_name"),
        "skills",
        ["normalized_name"],
        unique=True,
    )

    op.create_table(
        "evidence_skills",
        sa.Column(
            "evidence_id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "skill_id",
            sa.UUID(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["evidence_id"],
            ["evidence.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["skill_id"],
            ["skills.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "evidence_id",
            "skill_id",
        ),
    )

    connection = op.get_bind()

    skills_table = sa.table(
        "skills",
        sa.column("id", sa.UUID()),
        sa.column("name", sa.String(length=120)),
        sa.column(
            "normalized_name",
            sa.String(length=120),
        ),
    )

    evidence_skills_table = sa.table(
        "evidence_skills",
        sa.column("evidence_id", sa.UUID()),
        sa.column("skill_id", sa.UUID()),
    )

    evidence_rows = connection.execute(
        sa.text(
            """
            SELECT id, skills
            FROM evidence
            ORDER BY created_at, id
            """
        )
    ).mappings()

    skill_ids: dict[str, object] = {}
    skill_rows: list[dict[str, object]] = []
    relationship_rows: list[dict[str, object]] = []

    for evidence in evidence_rows:
        evidence_id = evidence["id"]
        existing_skills = evidence["skills"] or []
        evidence_skill_names: set[str] = set()

        for existing_skill in existing_skills:
            name = existing_skill.strip()

            if not name:
                continue

            normalized_name = name.casefold()

            if normalized_name in evidence_skill_names:
                continue

            evidence_skill_names.add(normalized_name)

            skill_id = skill_ids.get(normalized_name)

            if skill_id is None:
                skill_id = uuid4()
                skill_ids[normalized_name] = skill_id

                skill_rows.append(
                    {
                        "id": skill_id,
                        "name": name,
                        "normalized_name": normalized_name,
                    }
                )

            relationship_rows.append(
                {
                    "evidence_id": evidence_id,
                    "skill_id": skill_id,
                }
            )

    if skill_rows:
        connection.execute(
            skills_table.insert(),
            skill_rows,
        )

    if relationship_rows:
        connection.execute(
            evidence_skills_table.insert(),
            relationship_rows,
        )

    migrated_skill_count = connection.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM skills
            """
        )
    ).scalar_one()

    migrated_relationship_count = connection.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM evidence_skills
            """
        )
    ).scalar_one()

    if migrated_skill_count != len(skill_rows):
        raise RuntimeError(
            "Skill migration verification failed."
        )

    if migrated_relationship_count != len(
        relationship_rows
    ):
        raise RuntimeError(
            "Evidence-skill relationship migration "
            "verification failed."
        )

    op.drop_column(
        "evidence",
        "skills",
    )


def downgrade() -> None:
    op.add_column(
        "evidence",
        sa.Column(
            "skills",
            postgresql.ARRAY(
                sa.String(length=120)
            ),
            nullable=True,
        ),
    )

    connection = op.get_bind()

    connection.execute(
        sa.text(
            """
            UPDATE evidence AS e
            SET skills = COALESCE(
                (
                    SELECT array_agg(
                        s.name
                        ORDER BY s.normalized_name
                    )
                    FROM evidence_skills AS es
                    JOIN skills AS s
                        ON s.id = es.skill_id
                    WHERE es.evidence_id = e.id
                ),
                '{}'::varchar(120)[]
            )
            """
        )
    )

    op.alter_column(
        "evidence",
        "skills",
        existing_type=postgresql.ARRAY(
            sa.String(length=120)
        ),
        nullable=False,
    )

    op.drop_table(
        "evidence_skills",
    )

    op.drop_index(
        op.f("ix_skills_normalized_name"),
        table_name="skills",
    )

    op.drop_table(
        "skills",
    )