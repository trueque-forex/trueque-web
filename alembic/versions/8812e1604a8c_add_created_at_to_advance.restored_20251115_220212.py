"""add_created_at_to_advance

Revision ID: 8812e1604a8c
Revises: dd245b139879
Create Date: 2025-10-24 00:00:00.000000
"""
from alembic import context, op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "8812e1604a8c"
down_revision = "dd245b139879"
branch_labels = None
depends_on = None


def _inspector_for_bind():
    if context.is_offline_mode():
        return None
    try:
        bind = op.get_bind()
        return inspect(bind)
    except Exception:
        return None

def _table_exists(inspector, name: str) -> bool:
    if inspector is None:
        return False
    try:
        return name in inspector.get_table_names()
    except Exception:
        return False

def _column_exists(inspector, table: str, column: str) -> bool:
    if inspector is None:
        return False
    try:
        cols = [c["name"] for c in inspector.get_columns(table)]
        return column in cols
    except Exception:
        return False

def upgrade() -> None:
    inspector = _inspector_for_bind()
    if _table_exists(inspector, "advances") and not _column_exists(inspector, "advances", "created_at"):
        try:
            op.add_column("advances", sa.Column("created_at", sa.TIMESTAMP(), nullable=True))
        except Exception:
            pass

def downgrade() -> None:
    inspector = _inspector_for_bind()
    if _table_exists(inspector, "advances") and _column_exists(inspector, "advances", "created_at"):
        try:
            op.drop_column("advances", "created_at")
        except Exception:
            pass
    """Return an Inspector when running online; otherwise None for offline SQL generation."""
    if context.is_offline_mode():
        return None
    try:
        bind = op.get_bind()
        return inspect(bind)
    except Exception:
        return None


def _table_exists(inspector, name: str) -> bool:
    if inspector is None:
        return False
    try:
        return name in inspector.get_table_names()
    except Exception:
        return False


def _column_exists(inspector, table: str, column: str) -> bool:
    if inspector is None:
        return False
    try:
        cols = [c["name"] for c in inspector.get_columns(table)]
        return column in cols
    except Exception:
        return False


def upgrade() -> None:
    """Non-creator: add created_at column to advances only if table exists and column missing."""
    inspector = _inspector_for_bind()

    if _table_exists(inspector, "advances") and not _column_exists(inspector, "advances", "created_at"):
        try:
            op.add_column("advances", sa.Column("created_at", sa.TIMESTAMP(), nullable=True))
        except Exception:
            pass


def downgrade() -> None:
    """Guarded rollback: remove created_at column only if present."""
    inspector = _inspector_for_bind()

    if _table_exists(inspector, "advances") and _column_exists(inspector, "advances", "created_at"):
        try:
            op.drop_column("advances", "created_at")
        except Exception:
            pass
