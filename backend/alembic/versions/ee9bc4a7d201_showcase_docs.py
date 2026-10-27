"""Add versioned showcase documentation and publishing gate.

Revision ID: ee9bc4a7d201
Revises: c613e8a4f027
"""
from alembic import op
import sqlalchemy as sa
from db.models import UTCDateTime

revision = "ee9bc4a7d201"
down_revision = "c613e8a4f027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "showcase_document",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("starts_at", UTCDateTime(), nullable=True),
        sa.Column("ends_at", UTCDateTime(), nullable=True),
        sa.Column("draft_json", sa.Text(), nullable=False),
        sa.Column("published_json", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("updated_at", UTCDateTime(), nullable=False),
    )
    op.create_table(
        "showcase_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("version", sa.Integer(), nullable=False, unique=True),
        sa.Column("content_json", sa.Text(), nullable=False),
        sa.Column("published_by", sa.String(length=64), nullable=False),
        sa.Column("published_at", UTCDateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("showcase_versions")
    op.drop_table("showcase_document")
