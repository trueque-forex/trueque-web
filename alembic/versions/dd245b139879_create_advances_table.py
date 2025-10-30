<<<<<<< HEAD
revision = 'dd245b139879'
down_revision = 'df88aff11ce5'

from sqlalchemy import inspect

def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = inspect(bind)

    # Safe drop: ix_offers_id
    offers_indexes = [ix['name'] for ix in inspector.get_indexes('offers')]
    if 'ix_offers_id' in offers_indexes:
        op.drop_index('ix_offers_id', table_name='offers')

    op.drop_table('offers')

    # Safe drop: ix_users_id
    users_indexes = [ix['name'] for ix in inspector.get_indexes('users')]
    if 'ix_users_id' in users_indexes:
        op.drop_index('ix_users_id', table_name='users')

    op.drop_table('users')
=======
"""create_advances_table

Revision ID: dd245b139879
Revises: 
Create Date: 2025-10-26 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "dd245b139879"
down_revision = None
branch_labels = None
depends_on = None


def _table_exists(inspector, name: str) -> bool:
    try:
        return name in inspector.get_table_names()
    except Exception:
        return False


def upgrade() -> None:
    """Create advances table if missing. Do not run reflection at import time."""
    bind = op.get_bind()
    inspector = inspect(bind)

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
    """Drop advances table if present."""
    bind = op.get_bind()
    inspector = inspect(bind)

    if _table_exists(inspector, "advances"):
        try:
            op.drop_table("advances")
        except Exception:
            pass
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
