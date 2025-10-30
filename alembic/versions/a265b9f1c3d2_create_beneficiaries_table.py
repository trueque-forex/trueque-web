"""create beneficiaries table

Revision ID: a265b9f1c3d2
Revises: 1e9cb683b43b
Create Date: 2025-10-26 00:00:00
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a265b9f1c3d2"
down_revision = "1e9cb683b43b"
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    insp = sa.engine.reflection.Inspector.from_engine(bind)

    # create table only if it does not exist
    if "beneficiaries" not in insp.get_table_names():
        op.create_table(
            "beneficiaries",
            sa.Column("id", sa.BigInteger, primary_key=True),
            sa.Column("owner_id", sa.BigInteger, nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("phone_country_code", sa.String(length=8), nullable=True),
            sa.Column("phone_national", sa.String(length=32), nullable=True),
            sa.Column("phone_e164", sa.String(length=32), nullable=True),
            sa.Column("metadata", sa.JSON, nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )

        # composite (owner + phone_e164) for fast lookup; phone_e164 may be NULL
        op.create_index(
            "ix_beneficiaries_owner_phone_e164",
            "beneficiaries",
            ["owner_id", "phone_e164"],
            unique=False,
        )

        # secondary index for owner lookups by name if useful
        op.create_index(
            "ix_beneficiaries_owner_name",
            "beneficiaries",
            ["owner_id", "name"],
            unique=False,
        )

def downgrade():
    bind = op.get_bind()
    insp = sa.engine.reflection.Inspector.from_engine(bind)

    if "beneficiaries" in insp.get_table_names():
        op.execute("DROP INDEX IF EXISTS ix_beneficiaries_owner_phone_e164")
        op.execute("DROP INDEX IF EXISTS ix_beneficiaries_owner_name")
        op.drop_table("beneficiaries")