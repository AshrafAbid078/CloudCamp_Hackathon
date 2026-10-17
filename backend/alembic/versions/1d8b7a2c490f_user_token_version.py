"""Revoke existing sessions after a password change."""
from alembic import op
import sqlalchemy as sa

revision = "1d8b7a2c490f"
down_revision = "0e53c01be55a"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("token_version", sa.Integer(), server_default="0", nullable=False))


def downgrade():
    op.drop_column("users", "token_version")
