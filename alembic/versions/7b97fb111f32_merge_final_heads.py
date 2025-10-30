"""merge final heads

Revision ID: 7b97fb111f32
Revises: 1e9cb683b43b, 832810d51e20
Create Date: 2025-10-26 13:41:13.441511

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b97fb111f32'
down_revision: Union[str, Sequence[str], None] = ('1e9cb683b43b', '832810d51e20')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
