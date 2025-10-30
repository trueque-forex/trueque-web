

---



\## 📘 `REPO\_MANIFEST.md`



This file declares repo boundaries, purpose, and tag strategy.



```markdown

\# Repo Manifest — Trueque Web



\## Purpose

This is the canonical backend repository for Trueque. It contains:



\- Alembic migrations

\- API and orchestration logic

\- Sender UX flow logic

\- Audit-grade compliance scaffolding



\## Repo boundaries

\- `trueque\_web/`: Backend module (API, migrations, orchestration)

\- `trueque\_mobile/`: Legacy folder (preserved for audit and onboarding clarity)

\- Other repos (`trueque-backend`, `trueque-remittance`) are deprecated or corridor-specific



\## Tagging strategy

Use annotated tags to anchor reproducible states:



\- Format: `safe-trueque-web-YYYY-MM-DD`

\- Example: `safe-trueque-web-2025-10-24` — unified backend, Alembic restored, onboarding clarity



\## Migration safety

\- All migrations must be idempotent

\- Index drops use safe guards to prevent errors on re-run

\- Tag reproducible states after major schema or orchestration changes



\## Maintainer notes

\- This repo anchors reproducibility and onboarding clarity

\- All future corridor logic (e.g. Nigeria–Ghana) should be modularized inside `trueque\_web`

\- Sender UX flow must include market rate disclosure, fee breakdown, and delivery choice

