"""bootstrap ORM models

Revision ID: 832810d51e20
Revises: 1ce288b0d18e
Create Date: 2025-10-24 10:07:05.775695

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '832810d51e20'
down_revision: Union[str, Sequence[str], None] = '1ce288b0d18e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
