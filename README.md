# 🚗 Road Warrior

> **Empowering India's delivery riders to switch to electric vehicles — one referral at a time.**

Road Warrior is a survey + referral platform built for delivery riders (Swiggy, Zomato, Rapido, Ola, Uber, etc.) that helps them understand the benefits of electric vehicles, captures their pain points with petrol vehicles, and rewards them for referring fellow riders. Top referrers are featured in a public leaderboard and may receive exclusive rewards.

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

| Layer        | Technology                                                               |
|--------------|--------------------------------------------------------------------------|
| **Backend**  | Python 3.11 · FastAPI · SQLAlchemy 2.0 (async) · asyncpg · Alembic      |
| **Database** | Neon (serverless PostgreSQL 16)                                          |
| **Frontend** | Next.js 14 (App Router) · TypeScript · Tailwind CSS · next-intl          |
| **Messaging**| Twilio WhatsApp Business API                                             |
| **Hosting**  | Frontend → Vercel · Backend → Render                                     |
| **Quality**  | pytest · ruff · black · mypy · pre-commit                                |

---

## ✨ Features

- 📝 Multi-step rider survey (web + WhatsApp)
- 🌍 Trilingual: English, Hindi, Kannada
- 🏆 Public leaderboard with milestone badges (10 / 25 / 50 referrals)
- 🔗 Unique referral codes + shareable links + QR codes
- 📊 Admin dashboard with analytics
- 💬 WhatsApp chatbot with stateful sessions
- 📈 Real-time points engine

---

## 🚀 Local Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database

### Setup

```bash
git clone <repo-url> road-warrior
cd road-warrior

# Backend
cp backend/.env.example backend/.env   # fill in DATABASE_URL (Neon) + JWT_SECRET
cd backend && python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head                   # run migrations
uvicorn app.main:app --reload          # starts on http://localhost:8000

# Frontend (new terminal)
cd frontend
cp .env.local.example .env.local       # set NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev                            # starts on http://localhost:3000
```

### Local URLs

| Service         | URL                                  |
|-----------------|--------------------------------------|
| Frontend        | http://localhost:3000                |
| API docs        | http://localhost:8000/docs           |
| Health check    | http://localhost:8000/api/health     |
| Admin dashboard | http://localhost:3000/admin          |

---

## 📁 Project Structure

```
ev_challenge/
├── backend/                  # FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── api/              # Route handlers (riders, admin, webhooks)
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic (referral, points)
│   │   └── main.py           # FastAPI app factory
│   ├── alembic/              # Database migrations
│   ├── tests/                # pytest suite
│   └── requirements.txt
├── frontend/                 # Next.js 14 (App Router)
│   ├── app/
│   │   ├── [lang]/           # Localised pages (en / hi / kn)
│   │   └── admin/            # Admin dashboard pages
│   ├── components/           # Shared UI components
│   ├── lib/                  # API client, types, i18n config
│   ├── messages/             # Translation JSON files
│   └── middleware.ts         # Locale routing middleware
├── render.yaml               # Render Blueprint (backend deployment)
├── Makefile                  # Common dev commands
└── README.md                 # ← you are here
```

---

## ☁️ Deployment

### Backend → Render

The `render.yaml` file at the project root is a Render Blueprint. Connect your GitHub repo on [Render](https://render.com), select **Blueprint**, and it will auto-configure the Python service.

**Required environment variables on Render:**

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `DATABASE_URL`        | Neon PostgreSQL connection string    |
| `JWT_SECRET`          | Secret for admin JWT tokens          |
| `FRONTEND_BASE_URL`   | Your Vercel frontend URL             |
| `WHATSAPP_TOKEN`      | Twilio / WhatsApp token (optional)   |
| `WHATSAPP_PHONE_ID`   | WhatsApp phone ID (optional)         |

### Frontend → Vercel

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variables:

| Variable                | Description                         |
|-------------------------|-------------------------------------|
| `NEXT_PUBLIC_API_URL`   | Render backend URL (no trailing `/`)|
| `NEXT_PUBLIC_BASE_URL`  | Your Vercel frontend URL            |

Vercel auto-deploys on every push to `main`.

---

## 🔐 Environment Variables

See **[ENV.md](./ENV.md)** for the full reference with types, defaults, and examples.

---

## 🧪 Testing

```bash
# Backend tests
cd backend
source venv/bin/activate
pytest

# Lint + type checks
ruff check app/
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/short-name`
2. Install pre-commit hooks: `pre-commit install`
3. Make your changes — run `pytest` and `ruff` before pushing
4. Open a PR against `main`

---

## 📄 License

Internal project for the EV Challenge. Contact maintainers before reusing.

---

> Built with ❤️ for India's delivery riders.
