# 🚗 Road Warrior

> **Empowering India's delivery riders to switch to electric vehicles — one referral at a time.**

Road Warrior is a survey + referral platform built for delivery riders (Swiggy, Zomato, Rapido, Ola, Uber, etc.) that helps them understand the benefits of electric vehicles, captures their pain points with petrol vehicles, and rewards them for referring fellow riders. Top referrers are featured in our public leaderboard and may receive exclusive rewards.

---

## 🧩 The Problem

India has **4M+ delivery riders** burning ₹2,500–4,000/month on fuel and maintenance. EV adoption in this segment is below 5% because of:

- Range anxiety and lack of charging infrastructure
- High upfront EV cost
- Misinformation about total cost of ownership
- No peer-driven success stories

## 💡 Our Solution

A two-channel platform:

1. **Web survey** — riders fill out a 2-minute survey, get **10 starter points** + a unique referral link
2. **WhatsApp chatbot** — riders can complete the survey entirely in WhatsApp (Hindi/Kannada/English)

Each successful referral = **+5 points**. Milestones at 10 / 25 / 50 referrals unlock badges and (eventually) real rewards.

---

## 🛠️ Tech Stack

| Layer       | Technology                                                        |
|-------------|-------------------------------------------------------------------|
| **Backend** | Python 3.11 · FastAPI · SQLAlchemy 2.0 (async) · asyncpg · Alembic |
| **Database**| Neon (serverless PostgreSQL 16)                                   |
| **Frontend**| Next.js 14 (App Router) · TypeScript · Tailwind CSS · next-intl   |
| **Messaging**| Twilio WhatsApp Business API (PR #4)                             |
| **Infra**   | Docker · docker-compose · Makefile                                |
| **Quality** | pytest · ruff · black · mypy · pre-commit                         |

---

## ✨ Features

- 📝 Multi-step rider survey (web + WhatsApp)
- 🌍 Trilingual: English, Hindi, Kannada
- 🏆 Public leaderboard with milestone badges (10/25/50)
- 🔗 Unique referral codes + shareable links + QR codes
- 📊 Admin dashboard (PR #2)
- 💬 WhatsApp chatbot with stateful sessions (PR #4)
- 📈 Real-time points engine (PR #2)

---

## 🚀 Quick Start (TL;DR)

```bash
git clone <repo-url> road-warrior
cd road-warrior
cp backend/.env.example backend/.env       # fill in DATABASE_URL (Neon)
cp frontend/.env.local.example frontend/.env.local
make install                                # install all deps
make db-migrate                             # apply schema to Neon
make docker-up                              # start full local stack
```

Then visit:
- 🌐 **Frontend:** http://localhost:3000
- 📚 **API docs:** http://localhost:8000/docs
- ❤️ **Health check:** http://localhost:8000/api/health

---

## 📁 Project Structure

```
ev_challenge/
├── backend/                 # FastAPI + SQLAlchemy + Alembic
│   ├── app/                 # Application code (models, schemas, api, services)
│   ├── alembic/             # Database migrations
│   ├── tests/               # pytest suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js 14 (App Router)
│   ├── app/                 # Pages & layouts
│   └── ...
├── docker-compose.yml       # Local dev stack
├── Makefile                 # All common commands
├── README.md                # ← you are here
├── SETUP.md                 # Detailed setup guide
├── DEPLOYMENT.md            # Production deployment guide
├── ENV.md                   # All env vars explained
└── prs/                     # PR-by-PR specifications
```

---

## 🔐 Environment Variables

See **[ENV.md](./ENV.md)** for the full list with defaults, types, and examples.

---

## 🧪 Manual Test Plan

See **[SETUP.md → "Verification"](./SETUP.md#-verification)** for the full smoke test.

---

## 🤝 Contributing

1. Read `prs/pr-N-*.md` for the relevant PR spec
2. Create a feature branch: `git checkout -b feature/pr-N-short-name`
3. Install pre-commit hooks: `pre-commit install`
4. Make your changes — run `make lint test` before pushing
5. Open a PR referencing the PR number

---

## 📄 License

TBD — internal project for the EV Challenge. Contact maintainers before reusing.

---

## 🔗 Related Docs

- 📘 [SETUP.md](./SETUP.md) — local dev setup walkthrough
- 🚢 [DEPLOYMENT.md](./DEPLOYMENT.md) — production deployment
- 🔐 [ENV.md](./ENV.md) — environment variable reference
- 📋 `prs/` — detailed PR-by-PR specifications

---

> Built with ❤️ for India's delivery riders.
