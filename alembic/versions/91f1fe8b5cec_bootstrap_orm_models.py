"""bootstrap ORM models

Revision ID: 91f1fe8b5cec
Revises: d50f87988108
Create Date: 2025-10-24 09:52:30.710302

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '91f1fe8b5cec'
down_revision: Union[str, Sequence[str], None] = 'd50f87988108'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
