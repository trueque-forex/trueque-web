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