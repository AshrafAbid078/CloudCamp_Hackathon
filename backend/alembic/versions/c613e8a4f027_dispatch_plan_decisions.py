"""Record operator decisions separately from immutable dispatch plans.

Revision ID: c613e8a4f027
Revises: b72c4f0a9d10
"""
from alembic import op
import sqlalchemy as sa
from db.models import UTCDateTime

revision = "c613e8a4f027"
down_revision = "b72c4f0a9d10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dispatch_plan_decisions",
        sa.Column("run_id", sa.Integer(), sa.ForeignKey("dispatch_plan_records.id"), primary_key=True),
        sa.Column("action", sa.String(length=16), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("decided_by", sa.String(length=64), nullable=False),
        sa.Column("decided_at", UTCDateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("dispatch_plan_decisions")
