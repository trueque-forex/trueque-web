[![CI](https://github.com/trueque-forex/trueque-web/actions/workflows/ci.yml/badge.svg)](https://github.com/trueque-forex/trueque-web/actions/workflows/ci.yml)

# 🌐 Trueque Web

**Instant, transparent, and fair remittance—built for reproducibility and dignity.**

---

## 🚀 Live Demo

[![Vercel Deploy](https://vercel.com/button)](https://trueque-web.vercel.app)

---

## 🚀 Deployment

- Hosted on Vercel: [Live Demo](https://trueque.vercel.app) ← update with actual link
- CI badge: ![CI Status](https://img.shields.io/github/actions/workflow/status/trueque-forex/trueque/ci.yml)
- Reproducibility summary: corridor filtering, fallback UX, audit preview all validated with test harnesses

---

## 📦 Tech Stack

- **Frontend**: React + Vite
- **Build Tool**: Rollup
- **Testing**: Vitest
- **Deployment**: Vercel
- **Config**: `vite.config.js` with `@vitejs/plugin-react`

---

## 🧪 Audit-Grade Features

- ✅ Modular fallback UX with breach scenario coverage
- ✅ Corridor-specific remittance logic
- ✅ Audit preview with corridor filtering
- ✅ Reproducible test harness for backend flows
- 📘 [Architecture Overview](docs/architecture.md)

---
## 🧩 Logging & Monitoring

Trueque includes audit-grade logging and monitoring for reproducibility and team onboarding.

- **Frontend logs**: UX events, fallback triggers, audit preview
- **Backend logs**: audit fetches, corridor filtering, fallback acknowledgment
- **Location-aware**: All logs include inferred or header-based location (default: Redlands, CA)
- **Monitoring**: `/health` endpoint returns `{ status, location, timestamp }`
- **Sample logs**: See [`docs/logs/sample.json`](docs/logs/sample.json)

---

## 🛠 Setup Instructions

```bash
# Clone the repo
git clone https://github.com/trueque-forex/trueque-web.git
cd trueque-web

# Install dependencies
npm install

# Start dev server
npm run dev