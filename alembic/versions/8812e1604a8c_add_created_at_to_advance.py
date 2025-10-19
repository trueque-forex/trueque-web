revision = '8812e1604a8c'
down_revision = None

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

    # Safe drop: ix_advances_id and ix_advances_uuid
    advances_indexes = [ix['name'] for ix in inspector.get_indexes('advances')]
    if 'ix_advances_id' in advances_indexes:
        op.drop_index('ix_advances_id', table_name='advances')
    if 'ix_advances_uuid' in advances_indexes:
        op.drop_index('ix_advances_uuid', table_name='advances')

    op.drop_table('advances')