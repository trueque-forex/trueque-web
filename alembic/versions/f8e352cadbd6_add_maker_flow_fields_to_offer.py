"""add maker flow fields to offer

Revision ID: f8e352cadbd6
Revises: 6b9f3c2d4a1b
Create Date: 2026-08-02 18:16:51.414328

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8e352cadbd6'
down_revision: Union[str, Sequence[str], None] = '6b9f3c2d4a1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('offers', sa.Column('destination_id', sa.Integer(), nullable=True))
    op.add_column('offers', sa.Column('funding_account_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('offers', sa.Column('adyen_stored_payment_id', sa.String(), nullable=True))
    op.add_column('offers', sa.Column('adyen_psp_reference', sa.String(), nullable=True))
    op.add_column('offers', sa.Column('funding_status', sa.String(), server_default='pending', nullable=True))
    
    op.create_foreign_key('fk_offers_destination_id', 'offers', 'recipient_profiles', ['destination_id'], ['id'])
    op.create_foreign_key('fk_offers_funding_account_id', 'offers', 'accounts', ['funding_account_id'], ['account_id'])

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_offers_funding_account_id', 'offers', type_='foreignkey')
    op.drop_constraint('fk_offers_destination_id', 'offers', type_='foreignkey')
    op.drop_column('offers', 'funding_status')
    op.drop_column('offers', 'adyen_psp_reference')
    op.drop_column('offers', 'adyen_stored_payment_id')
    op.drop_column('offers', 'funding_account_id')
    op.drop_column('offers', 'destination_id')
