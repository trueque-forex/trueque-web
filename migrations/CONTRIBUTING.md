\# Contributing to Trueque Web



Welcome! This repo anchors Trueque’s backend logic, migrations, and orchestration flows. We value clarity, reproducibility, and user trust. Every contribution should reinforce those principles.



\## 🧭 Repo boundaries



This repo includes:

\- `trueque\_web/`: Backend module (API, orchestration, Alembic)

\- `trueque\_mobile/`: Legacy folder (preserved for audit)

\- All migrations and compliance logic live here



Other repos (`trueque-backend`, `trueque-remittance`) are deprecated or corridor-specific.



\## 🛠️ Setup



1\. Clone the repo:

&nbsp;  ```bash

&nbsp;  git clone git@github.com:trueque-forex/trueque-web.git

&nbsp;  cd trueque-web



2\. Create and activate a virtual environment:

python -m venv venv

source venv/bin/activate  # or venv\\Scripts\\activate on Windows



3\. - Install dependencies:

pip install -r requirements.txt



4\. Use Alembic to manage schema changes:

alembic upgrade head

alembic revision --autogenerate -m "describe change"



All migrations must be:- Idempotent

\- Safe to re-run

\- Tagged after major changes (safe-trueque-web-YYYY-MM-DD)



🧼 Coding standards- Follow PEP8 for Python

\- Use descriptive commit messages

\- Document all new modules and flows

\- Include onboarding notes for new contributors



🧠 UX and complianceAll sender UX flows must include:- Market rate disclosure with source and fixed window

\- Offer selection from recipient-side liquidity

\- Sender-led delivery choice

\- Final confirmation with effective rate comparison and fee breakdown



🛡️ AuthenticationPrivileged actions must be gated with server-side authentication. No sensitive flows should be exposed to unauthenticated users.🧾 Tagging reproducible statesUse annotated tags to anchor safe backend states:



Tagging reproducible states

Use annotated tags to anchor safe backend states:

git tag -a safe-trueque-web-YYYY-MM-DD -m "describe state"

git push origin safe-trueque-web-YYYY-MM-DD



🤝 How to contribute- Fork the repo

\- Create a feature branch

\- Submit a pull request with clear description

\- Tag reproducible states if applicable

\- Celebrate shared success 🎉

Thanks for contributing to Trueque — every commit is a step toward fairness, clarity, and user empowerment.

