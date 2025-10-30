"""merge heads

Revision ID: 1e9cb683b43b
Revises: 25a2339a628f,8812e1604a8c,d50f87988108,dd245b139879,df88aff11ce5
Create Date: 2025-10-26 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "1e9cb683b43b"
down_revision = ("25a2339a628f", "8812e1604a8c", "d50f87988108", "dd245b139879", "df88aff11ce5")
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Merge point: no DB changes required; recorded to unify heads."""
    pass


def downgrade() -> None:
    """No-op downgrade for merge commit."""
    pass