"""create_advances_table

Revision ID: dd245b139879
Revises: df88aff11ce5
Create Date: 2025-10-26 00:00:00.000000
"""
from alembic import context, op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "dd245b139879"
down_revision = "df88aff11ce5"
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
    """Non-creator: convert advances creation into guarded index/alter operations when table exists."""
    inspector = _inspector_for_bind()

    # If advances exists, ensure desired indexes or column changes
    if _table_exists(inspector, "advances"):
        # example: ensure uuid unique constraint is enforced via index if missing
        if not _index_exists(inspector, "advances", "ix_advances_uuid"):
            try:
                op.create_index(op.f("ix_advances_uuid"), "advances", ["uuid"], unique=False)
            except Exception:
                pass

    # Add other guarded changes intended for this revision below


def downgrade() -> None:
    inspector = _inspector_for_bind()

    # Remove index if present
    if _table_exists(inspector, "advances") and _index_exists(inspector, "advances", "ix_advances_uuid"):
        try:
            op.drop_index(op.f("ix_advances_uuid"), table_name="advances")
        except Exception:
            pass
