"""merge beneficiaries into unified head

Revision ID: d83fb05588c6
Revises: 7b97fb111f32, 20251026_create_beneficiaries_table
Create Date: 2025-10-26 15:46:43.703500

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd83fb05588c6'
down_revision: Union[str, Sequence[str], None] = ('7b97fb111f32', 'a265b9f1c3d2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
