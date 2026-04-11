"""save_schema_changes_from_oct_23_24

Revision ID: d50f87988108
Revises: 25a2339a628f
Create Date: 2025-10-24 07:53:47.584486
"""
from alembic import context, op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d50f87988108"
down_revision = "25a2339a628f"
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


def _index_exists(inspector, table: str, index_name: str) -> bool:
    if inspector is None:
        return False
    try:
        return index_name in [ix["name"] for ix in inspector.get_indexes(table)]
    except Exception:
        return False


def upgrade() -> None:
    """Non-creator: only operate on advances when the canonical creator already created it."""
    inspector = _inspector_for_bind()

    # If advances exists, create example index if missing
    if _table_exists(inspector, "advances") and not _index_exists(inspector, "advances", "ix_advances_uuid"):
        try:
            op.create_index(op.f("ix_advances_uuid"), "advances", ["uuid"], unique=False)
        except Exception:
            pass

    # Put other guarded changes for this revision here


def downgrade() -> None:
    """Revert non-destructive changes safely where possible."""
    inspector = _inspector_for_bind()

    if _table_exists(inspector, "advances") and _index_exists(inspector, "advances", "ix_advances_uuid"):
        try:
            op.drop_index(op.f("ix_advances_uuid"), table_name="advances")
        except Exception:
            pass

    return