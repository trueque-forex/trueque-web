"""create beneficiaries table

Revision ID: a265b9f1c3d2
Revises: 1e9cb683b43b
Create Date: 2025-10-26 00:00:00
"""
from alembic import context, op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "a265b9f1c3d2"
down_revision = "1e9cb683b43b"
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


def _index_exists(inspector, table: str, index_name: str) -> bool:
    if inspector is None:
        return False
    try:
        return index_name in [ix["name"] for ix in inspector.get_indexes(table)]
    except Exception:
        return False


def upgrade() -> None:
    inspector = _inspector_for_bind()

    # create table only if it does not exist
    if not _table_exists(inspector, "beneficiaries"):
        op.create_table(
            "beneficiaries",
            sa.Column("id", sa.BigInteger, primary_key=True),
            sa.Column("owner_id", sa.BigInteger, nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("phone_country_code", sa.String(length=8), nullable=True),
            sa.Column("phone_national", sa.String(length=32), nullable=True),
            sa.Column("phone_e164", sa.String(length=32), nullable=True),
            sa.Column("metadata", sa.JSON, nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )

    # create indexes if table exists and index is missing
    if _table_exists(inspector, "beneficiaries") and not _index_exists(inspector, "beneficiaries", "ix_beneficiaries_owner_phone_e164"):
        op.create_index(
            "ix_beneficiaries_owner_phone_e164",
            "beneficiaries",
            ["owner_id", "phone_e164"],
            unique=False,
        )

    if _table_exists(inspector, "beneficiaries") and not _index_exists(inspector, "beneficiaries", "ix_beneficiaries_owner_name"):
        op.create_index(
            "ix_beneficiaries_owner_name",
            "beneficiaries",
            ["owner_id", "name"],
            unique=False,
        )


def downgrade() -> None:
    inspector = _inspector_for_bind()

    # Drop indexes if present
    if _table_exists(inspector, "beneficiaries") and _index_exists(inspector, "beneficiaries", "ix_beneficiaries_owner_phone_e164"):
        try:
            op.drop_index("ix_beneficiaries_owner_phone_e164", table_name="beneficiaries")
        except Exception:
            pass

    if _table_exists(inspector, "beneficiaries") and _index_exists(inspector, "beneficiaries", "ix_beneficiaries_owner_name"):
        try:
            op.drop_index("ix_beneficiaries_owner_name", table_name="beneficiaries")
        except Exception:
            pass

    # Only drop table if it was created by this revision and is present
    if _table_exists(inspector, "beneficiaries"):
        try:
            op.drop_table("beneficiaries")
        except Exception:
            pass