"""Store complete v2 dispatch plans.

Revision ID: b72c4f0a9d10
Revises: 0e53c01be55a
"""
from alembic import op
import sqlalchemy as sa
from db.models import UTCDateTime

revision = "b72c4f0a9d10"
down_revision = "0e53c01be55a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dispatch_plan_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", UTCDateTime(), nullable=False),
        sa.Column("created_by", sa.String(length=64), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("dispatch_plan_records")
