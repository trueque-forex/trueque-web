"""add username and canonical columns to users

Revision ID: 6b9f3c2d4a1b
Revises: merge_fix_20251120T203853
Create Date: 2025-11-22 10:45:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision = "6b9f3c2d4a1b"
down_revision = "merge_fix_20251120T203853"
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()

    # Add columns if missing (idempotent)
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255)"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_canonical VARCHAR(320)"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username_canonical VARCHAR(320)"))

    # Add indexes if missing
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_email_canonical ON users (email_canonical)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_username_canonical ON users (username_canonical)"))

    # Safe backfill for canonical columns (only when empty)
    conn.execute(text("""
        UPDATE users
        SET email_canonical = LOWER(TRIM(email))
        WHERE email IS NOT NULL AND (email_canonical IS NULL OR email_canonical = '');
    """))
    conn.execute(text("""
        UPDATE users
        SET username_canonical = LOWER(TRIM(username))
        WHERE username IS NOT NULL AND (username_canonical IS NULL OR username_canonical = '');
    """))

def downgrade():
    conn = op.get_bind()
    conn.execute(text("DROP INDEX IF EXISTS ix_users_username_canonical"))
    conn.execute(text("DROP INDEX IF EXISTS ix_users_email_canonical"))
    conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS username_canonical"))
    conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS email_canonical"))
    conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS username"))