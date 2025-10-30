\# Alembic Migrations — Trueque Web



\## Overview

This repo uses Alembic to manage database schema changes. All migrations are tracked inside `trueque\_web/alembic`.



\## Structure

\- Alembic config: `trueque\_web/alembic.ini`

\- Migration scripts: `trueque\_web/alembic/versions/`

\- Target metadata: `Base.metadata` from `backend.models.transaction`



\## Running migrations

To apply the latest schema changes:



```bash

alembic upgrade head



alembic revision --autogenerate -m "describe change"

