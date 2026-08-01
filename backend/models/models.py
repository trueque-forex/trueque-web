# backend/models/models.py
#
# This file exists solely as a compatibility shim for:
#   - backend/migrations/env.py  (imports `metadata` for Alembic autogenerate)
#   - backend/init_db.py         (imports `metadata` for metadata.create_all)
#
# All table definitions have been migrated to individual ORM model files.
# DO NOT add new Table() or model definitions here. Use the per-model files instead.

from backend.database import Base

# Re-export Base.metadata so legacy callers (Alembic, init_db) keep working
# without any changes to their import statements.
metadata = Base.metadata