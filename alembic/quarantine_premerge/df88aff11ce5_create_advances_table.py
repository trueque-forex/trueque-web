<<<<<<< HEAD
revision = 'df88aff11ce5'
down_revision = '8812e1604a8c'

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
=======
"""create_advances_table

Revision ID: df88aff11ce5
Revises: 
Create Date: 2025-10-26 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

# revision identifiers, used by Alembic.
revision = "df88aff11ce5"
down_revision = None
branch_labels = None
depends_on = None


def _table_exists(inspector, name: str) -> bool:
    try:
        return name in inspector.get_table_names()
    except Exception:
        return False


def upgrade() -> None:
    """Create advances table if missing and perform guarded index work safely."""
    bind = op.get_bind()
    inspector = inspect(bind)

    # Create advances table only if it does not already exist
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

    # Guarded users-related index logic: only run if users table exists
    if _table_exists(inspector, "users"):
        try:
            users_indexes = [ix["name"] for ix in inspector.get_indexes("users")]
        except Exception:
            users_indexes = []

        # Example: create an email index if it does not exist
        if "ix_users_email" not in users_indexes:
            op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)


def downgrade() -> None:
    """Drop advances table if present and remove index created above if present."""
    bind = op.get_bind()
    inspector = inspect(bind)

    # Drop index if present and users table exists
    if _table_exists(inspector, "users"):
        try:
            index_names = [ix["name"] for ix in inspector.get_indexes("users")]
        except Exception:
            index_names = []
        if "ix_users_email" in index_names:
            try:
                op.drop_index(op.f("ix_users_email"), table_name="users")
            except Exception:
                pass

    # Drop advances table if present
    if _table_exists(inspector, "advances"):
        try:
            op.drop_table("advances")
        except Exception:
            pass
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
