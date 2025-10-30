"""save_schema_changes_from_oct_23_24

Revision ID: d50f87988108
Revises: 25a2339a628f
Create Date: 2025-10-24 07:53:47.584486
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d50f87988108"
down_revision = "25a2339a628f"
branch_labels = None
depends_on = None


def _table_exists(inspector, name: str) -> bool:
    try:
        return name in inspector.get_table_names()
    except Exception:
        return False


def _index_exists(inspector, table: str, index_name: str) -> bool:
    try:
        return index_name in [ix["name"] for ix in inspector.get_indexes(table)]
    except Exception:
        return False


def upgrade() -> None:
    """Apply saved schema changes in a safe, idempotent way."""
    bind = op.get_bind()
    inspector = inspect(bind)

    # Guarded create: advances table (only create if missing)
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

    # Guarded index creation example (adjust name/columns to actual intent)
    if _table_exists(inspector, "advances") and not _index_exists(inspector, "advances", "ix_advances_uuid"):
        op.create_index(op.f("ix_advances_uuid"), "advances", ["uuid"], unique=False)


def downgrade() -> None:
    """Revert the changes safely where possible."""
    bind = op.get_bind()
    inspector = inspect(bind)

    # Drop the example index if present
    if _table_exists(inspector, "advances") and _index_exists(inspector, "advances", "ix_advances_uuid"):
        try:
            op.drop_index(op.f("ix_advances_uuid"), table_name="advances")
        except Exception:
            pass

    # Do not drop the advances table here unless this file is the canonical creator.