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