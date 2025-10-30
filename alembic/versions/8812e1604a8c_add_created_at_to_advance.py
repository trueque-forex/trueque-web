<<<<<<< HEAD
revision = '8812e1604a8c'
down_revision = None

from sqlalchemy import inspect

def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = inspect(bind)

    # Safe drop: ix_users_id
    users_indexes = [ix['name'] for ix in inspector.get_indexes('users')]
    if 'ix_users_id' in users_indexes:
        op.drop_index('ix_users_id', table_name='users')

    op.drop_table('users')

    # Safe drop: ix_advances_id and ix_advances_uuid
    advances_indexes = [ix['name'] for ix in inspector.get_indexes('advances')]
    if 'ix_advances_id' in advances_indexes:
        op.drop_index('ix_advances_id', table_name='advances')
    if 'ix_advances_uuid' in advances_indexes:
        op.drop_index('ix_advances_uuid', table_name='advances')

    op.drop_table('advances')
=======
"""add_created_at_to_advance

Revision ID: 8812e1604a8c
Revises: dd245b139879
Create Date: 2025-10-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "8812e1604a8c"
down_revision = "dd245b139879"
branch_labels = None
depends_on = None


def _table_exists(inspector, name: str) -> bool:
    try:
        return name in inspector.get_table_names()
    except Exception:
        return False


def _column_exists(inspector, table: str, column: str) -> bool:
    try:
        cols = [c["name"] for c in inspector.get_columns(table)]
        return column in cols
    except Exception:
        return False


def upgrade() -> None:
    """Add created_at column to advances if missing (idempotent)."""
    bind = op.get_bind()
    inspector = inspect(bind)

    if _table_exists(inspector, "advances") and not _column_exists(inspector, "advances", "created_at"):
        op.add_column("advances", sa.Column("created_at", sa.TIMESTAMP(), nullable=True))


def downgrade() -> None:
    """Remove created_at column from advances if present."""
    bind = op.get_bind()
    inspector = inspect(bind)

    if _table_exists(inspector, "advances") and _column_exists(inspector, "advances", "created_at"):
        try:
            op.drop_column("advances", "created_at")
        except Exception:
            pass
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
