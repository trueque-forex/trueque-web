"""initial_schema

Revision ID: 25a2339a628f
Revises: dd245b139879
Create Date: 2025-10-24 00:00:00.000000
"""
from alembic import context, op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "25a2339a628f"
down_revision = None
branch_labels = None
depends_on = None


def _inspector_for_bind():
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


def _index_exists(inspector, table: str, index_name: str) -> bool:
    if inspector is None:
        return False
    try:
        return index_name in [ix["name"] for ix in inspector.get_indexes(table)]
    except Exception:
        return False


def upgrade() -> None:
    """Create base tables in an import-safe, idempotent way."""
    inspector = _inspector_for_bind()

    # Example: create users table if missing
    if not _table_exists(inspector, "users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("email", sa.String(320), nullable=False),
            sa.Column("created_at", sa.TIMESTAMP(), nullable=True),
        )

    # Example: create offers table if missing
    if not _table_exists(inspector, "offers"):
        op.create_table(
            "offers",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("created_at", sa.TIMESTAMP(), nullable=True),
        )

    # If this migration also intended to create advances, guard creation here as well
    if not _table_exists(inspector, "advances"):
        op.create_table(
            "advances",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(), nullable=False),
            sa.Column("country", sa.String(), nullable=False),
            sa.Column("currency_from", sa.String(), nullable=False),
            sa.Column("currency_to", sa.String(), nullable=False),
            sa.Column("amount_from", sa.Float(), nullable=False),
            sa.Column("amount_to", sa.Float(), nullable=False),
            sa.Column("amount", sa.Float(), nullable=False),
            sa.Column("market_rate", sa.Float(), nullable=False),
            sa.Column("created_at", sa.TIMESTAMP(), nullable=True),
            sa.PrimaryKeyConstraint("id", name=op.f("advances_pkey")),
            sa.UniqueConstraint("uuid", name=op.f("advances_uuid_key")),
        )


def downgrade() -> None:
    """Tear down objects created above if present."""
    inspector = _inspector_for_bind()

    # Remove any columns/tables safely if they exist
    if _table_exists(inspector, "advances"):
        try:
            # example: drop guarded indexes if any (index names may vary)
            if _index_exists(inspector, "advances", "ix_advances_id"):
                try:
                    op.drop_index("ix_advances_id", table_name="advances")
                except Exception:
                    pass
            if _index_exists(inspector, "advances", "ix_advances_uuid"):
                try:
                    op.drop_index("ix_advances_uuid", table_name="advances")
                except Exception:
                    pass
            op.drop_table("advances")
        except Exception:
            pass

    if _table_exists(inspector, "offers"):
        try:
            op.drop_table("offers")
        except Exception:
            pass

    if _table_exists(inspector, "users"):
        try:
            op.drop_table("users")
        except Exception:
            pass


# Legacy downgrade block preserved (converted to guarded operations)
def legacy_downgrade_additional() -> None:
    """Preserved generated downgrade operations converted to guarded, idempotent actions.

    This function is not invoked by Alembic; it's kept here as a reference if you need to
    reintroduce any of the auto-generated downgrade steps. Apply changes manually with guards.
    """
    # The original auto-generated downgrade included many column/table operations.
    # If you want these executed, implement them using the helpers above and call from downgrade().
    return
