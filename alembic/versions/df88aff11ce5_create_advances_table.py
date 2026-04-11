"""create_advances_table

Revision ID: df88aff11ce5
Revises: 8812e1604a8c
Create Date: 2025-10-26 00:00:00.000000
"""
from alembic import context, op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "df88aff11ce5"
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
    inspector = _inspector_for_bind()
    if _table_exists(inspector, "advances"):
        if not _index_exists(inspector, "advances", "ix_advances_uuid"):
            try:
                op.create_index(op.f("ix_advances_uuid"), "advances", ["uuid"], unique=False)
            except Exception:
                pass

def downgrade() -> None:
    inspector = _inspector_for_bind()
    if _table_exists(inspector, "advances") and _index_exists(inspector, "advances", "ix_advances_uuid"):
        try:
            op.drop_index(op.f("ix_advances_uuid"), table_name="advances")
        except Exception:
            pass
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
    """Non-creator: only perform guarded index/alter work if advances already exists."""
    inspector = _inspector_for_bind()

    # If advances exists, ensure any missing indexes (example)
    if _table_exists(inspector, "advances"):
        # ensure uuid unique constraint/index exists (if intended)
        if not _index_exists(inspector, "advances", "ix_advances_uuid"):
            try:
                op.create_index(op.f("ix_advances_uuid"), "advances", ["uuid"], unique=False)
            except Exception:
                pass

    # Other intended non-creation schema adjustments for this revision go here


def downgrade() -> None:
    """Guarded rollback: only remove indexes that this revision created if they exist."""
    inspector = _inspector_for_bind()

    if _table_exists(inspector, "advances") and _index_exists(inspector, "advances", "ix_advances_uuid"):
        try:
            op.drop_index(op.f("ix_advances_uuid"), table_name="advances")
        except Exception:
            pass
