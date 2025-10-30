"""bootstrap ORM models

Revision ID: 1ce288b0d18e
Revises: 91f1fe8b5cec
Create Date: 2025-10-24 10:02:41.625090

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ce288b0d18e'
down_revision: Union[str, Sequence[str], None] = '91f1fe8b5cec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
