"""merge_fix

Revision ID: merge_fix_20251120T203853
Revises: 8812e1604a8c, d83fb05588c6
Create Date: 2025-11-20 20:38:53
"""
from alembic import op
import sqlalchemy as sa

revision = "merge_fix_20251120T203853"
down_revision = ("8812e1604a8c", "d83fb05588c6")
branch_labels = None
depends_on = None

def upgrade() -> None:
    # merge-only revision: no schema changes
    pass

def downgrade() -> None:
    # reversible no-op
    pass

