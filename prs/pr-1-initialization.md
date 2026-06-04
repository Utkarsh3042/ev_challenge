# PR #1 — Project Initialization & Infrastructure Setup

## 🎯 Goal
Bootstrap the **Road Warrior** monorepo with the foundational infrastructure: project structure, environment configuration, database schema with migrations, Docker setup, and documentation. After this PR, a developer can clone the repo, set env vars, and have a working empty shell ready for backend and frontend development.

## 📋 Scope
- Repository scaffolding (backend + frontend folders)
- Root-level configuration files
- PostgreSQL database schema designed for Neon (with full async SQLAlchemy models)
- Alembic migrations setup
- Docker Compose for local development
- Environment variable templates
- Initial README, SETUP, and DEPLOYMENT docs
- `.gitignore`, editor config, and code quality tools

**OUT of scope for this PR** (covered in later PRs):
- FastAPI route implementations
- Next.js pages and components
- WhatsApp integration
- Twilio setup

## 🏗️ Tech Stack (Locked In)
- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0 (async), asyncpg, Alembic, Pydantic v2
- **Database:** Neon (serverless PostgreSQL 16)
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, next-intl
- **Dev Tools:** Docker, docker-compose, Makefile
- **WhatsApp (deferred to PR #4):** Twilio (final choice pending)


## 📁 Files to Create

### Root-level
```
ev_challenge/
├── README.md
├── SETUP.md
├── DEPLOYMENT.md
├── ENV.md
├── .gitignore
├── .editorconfig
├── .pre-commit-config.yaml
├── docker-compose.yml
├── Makefile
└── prs/
    ├── pr-1-initialization.md       (this file)
    ├── pr-2-backend.md
    ├── pr-3-frontend.md
    ├── pr-4-whatsapp.md
    └── pr-5-extras.md
```

### Backend folder
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app skeleton (no routes yet)
│   ├── config.py                    # Pydantic Settings for env vars
│   ├── database.py                  # Async SQLAlchemy engine + session factory
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                  # DeclarativeBase
│   │   ├── rider.py                 # Rider model
│   │   ├── points.py                # PointsTransaction model
│   │   ├── whatsapp.py              # WhatsAppMessage model
│   │   ├── whatsapp_session.py      # WhatsAppSession model (for chatbot)
│   │   └── admin.py                 # Admin model
│   ├── schemas/
│   │   └── __init__.py
│   ├── api/
│   │   └── __init__.py
│   ├── services/
│   │   └── __init__.py
│   ├── locales/
│   │   ├── en.json                  # Placeholder translations
│   │   ├── hi.json
│   │   └── kn.json
│   ├── auth/
│   │   └── __init__.py
│   └── utils/
│       └── __init__.py
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── (empty — first migration in next PR)
├── alembic.ini
├── tests/
│   ├── __init__.py
│   └── conftest.py
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── pyproject.toml
└── Dockerfile
```

### Frontend folder (skeleton only)
```
frontend/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .env.local.example
├── .eslintrc.json
├── app/
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Temporary "Hello Road Warrior" landing
│   └── globals.css
├── public/
│   └── favicon.ico
└── README.md
```

## 🗄️ Database Schema (Full SQL — for review before migration generation)

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- VARCHAR conventions (kept as strings for flexibility in this MVP):
-- vehicle_type: 'petrol', 'diesel', 'electric', 'other'
-- fuel_method: 'petrol_pump', 'home_charging', 'battery_swap', 'other'
-- open_to_switch: 'yes', 'no', 'already_ev', 'need_info'
-- has_insurance: 'yes', 'no', 'not_sure'
-- language: 'en', 'hi', 'kn'
-- source: 'web' | 'whatsapp'

CREATE TABLE riders (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name                VARCHAR(100) NOT NULL,
    phone                    VARCHAR(15) UNIQUE NOT NULL,
    city                     VARCHAR(50) NOT NULL,
    platform                 VARCHAR(20) NOT NULL,
    years_experience         INTEGER NOT NULL CHECK (years_experience >= 0 AND years_experience <= 50),
    preferred_language       VARCHAR(5)  NOT NULL DEFAULT 'en',

    vehicle_type             VARCHAR(20) NOT NULL,
    vehicle_brand_model      VARCHAR(100),
    fuel_method              VARCHAR(30) NOT NULL,
    weekly_expense           INTEGER NOT NULL CHECK (weekly_expense >= 0),
    monthly_maintenance      INTEGER NOT NULL CHECK (monthly_maintenance >= 0),

    top_challenges           TEXT[] NOT NULL DEFAULT '{}',
    ev_challenges            TEXT[] NOT NULL DEFAULT '{}',
    petrol_challenges        TEXT[] NOT NULL DEFAULT '{}',

    has_accident_insurance   VARCHAR(10) NOT NULL,
    has_health_insurance     VARCHAR(10) NOT NULL,
    paid_out_of_pocket       BOOLEAN NOT NULL DEFAULT FALSE,

    open_to_switch           VARCHAR(20) NOT NULL,
    switch_motivators        TEXT[] NOT NULL DEFAULT '{}',
    interested_in            TEXT[] NOT NULL DEFAULT '{}',

    referred_by_code         VARCHAR(20),
    referral_code            VARCHAR(20) UNIQUE NOT NULL,

    points                   INTEGER NOT NULL DEFAULT 10 CHECK (points >= 0),
    referral_count           INTEGER NOT NULL DEFAULT 0 CHECK (referral_count >= 0),
    milestone_10_reached     BOOLEAN NOT NULL DEFAULT FALSE,
    milestone_25_reached     BOOLEAN NOT NULL DEFAULT FALSE,
    milestone_50_reached     BOOLEAN NOT NULL DEFAULT FALSE,

    segments                 TEXT[] NOT NULL DEFAULT '{}',
    is_duplicate             BOOLEAN NOT NULL DEFAULT FALSE,
    source                   VARCHAR(20) NOT NULL DEFAULT 'web',
    notes                    TEXT,

    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_riders_phone           ON riders(phone);
CREATE INDEX idx_riders_referral_code   ON riders(referral_code);
CREATE INDEX idx_riders_city            ON riders(city);
CREATE INDEX idx_riders_vehicle_type    ON riders(vehicle_type);
CREATE INDEX idx_riders_created_at      ON riders(created_at DESC);
CREATE INDEX idx_riders_points          ON riders(points DESC);
CREATE INDEX idx_riders_referral_count  ON riders(referral_count DESC);
CREATE INDEX idx_riders_segments        ON riders USING GIN(segments);
```


```sql
CREATE TABLE points_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id        UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    type            VARCHAR(30) NOT NULL,
    points_delta    INTEGER NOT NULL,
    reason          TEXT,
    related_rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pts_rider_id   ON points_transactions(rider_id);
CREATE INDEX idx_pts_created_at ON points_transactions(created_at DESC);

CREATE TABLE whatsapp_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id        UUID REFERENCES riders(id) ON DELETE SET NULL,
    phone           VARCHAR(15) NOT NULL,
    direction       VARCHAR(10) NOT NULL,
    template        VARCHAR(50),
    language        VARCHAR(5),
    body            TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'queued',
    twilio_sid      VARCHAR(50),
    error           TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wm_phone    ON whatsapp_messages(phone);
CREATE INDEX idx_wm_rider_id ON whatsapp_messages(rider_id);
CREATE INDEX idx_wm_sent_at  ON whatsapp_messages(sent_at DESC);

CREATE TABLE whatsapp_sessions (
    phone            VARCHAR(15) PRIMARY KEY,
    step             VARCHAR(50) NOT NULL,
    partial_data     JSONB NOT NULL DEFAULT '{}'::jsonb,
    language         VARCHAR(5) NOT NULL DEFAULT 'en',
    last_active_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(200) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at on riders
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_riders_updated_at
    BEFORE UPDATE ON riders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

## 📝 Key File Contents (highlights)

### `backend/app/config.py`
- Uses `pydantic-settings` to load env vars
- All env vars declared with defaults and descriptions
- `database_url`, `jwt_secret`, `twilio_*`, `whatsapp_mode`, `cors_origins`, etc.

### `backend/app/database.py`
- Async engine with `asyncpg`
- `async_sessionmaker` factory
- `get_db()` dependency for FastAPI
- Connection pooling tuned for Neon (small pool, `pool_pre_ping=True`)

### `backend/app/main.py`
- FastAPI app instance
- CORS middleware (origins from config)
- Health check endpoint: `GET /api/health` returns `{"status": "ok"}`
- Auto-generated docs at `/docs` and `/redoc`
- Mounts `/api` router (empty for now)

### `docker-compose.yml`
- Service `db` (local Postgres 16 for dev — Neon is used in prod)
- Service `backend` (builds from `backend/Dockerfile`, hot-reload)
- Service `frontend` (Next.js dev server, hot-reload)
- All share a network and env file

### `Makefile` targets
```makefile
make install          # Install backend + frontend deps
make db-up            # Start local Postgres
make db-migrate       # Run Alembic migrations
make db-rollback      # Rollback last migration
make db-reset         # Drop, recreate, migrate
make seed             # Seed sample data
make backend          # Run FastAPI dev server
make frontend         # Run Next.js dev server
make test             # Run all tests
make docker-up        # docker-compose up
make docker-down      # docker-compose down
make lint             # Run linters
make format           # Run formatters
```

### `backend/requirements.txt`
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.0
pydantic==2.9.2
pydantic-settings==2.6.0
python-multipart==0.0.12
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
phonenumbers==8.13.52
qrcode[pil]==7.4.2
twilio==9.4.0
httpx==0.27.2
python-dotenv==1.0.1
```

### `backend/requirements-dev.txt`
```
-r requirements.txt
pytest==8.3.3
pytest-asyncio==0.24.0
pytest-cov==6.0.0
ruff==0.7.4
black==24.10.0
mypy==1.13.0
```

### Root `.gitignore`
- Python: `__pycache__/`, `*.pyc`, `.venv/`, `.env`
- Node: `node_modules/`, `.next/`, `out/`, `.env.local`
- IDE: `.vscode/`, `.idea/`
- OS: `.DS_Store`, `Thumbs.db`
- Logs: `*.log`
- Build: `dist/`, `build/`, `*.egg-info/`

### `README.md` sections
- Project intro + business problem
- Tech stack
- Features list
- Quick start (3 commands)
- Project structure
- Environment variables (link to ENV.md)
- Contributing
- License

### `SETUP.md` sections
- Prerequisites (Python 3.11, Node 20, Docker)
- Neon account setup (step-by-step with screenshots placeholder)
- Local dev setup
- First-time DB migration
- Running the app
- Troubleshooting

### `DEPLOYMENT.md` sections
- Neon production DB setup
- Backend deployment to Fly.io / Railway / Render
- Frontend deployment to Vercel
- Environment variable management
- Custom domain setup
- CI/CD basics

### `ENV.md` (every env var explained)
- Backend env vars with type, default, required, example
- Frontend env vars
- Twilio env vars
- Feature flags

## ✅ Acceptance Criteria
- [ ] `git clone` → `make install` → `make docker-up` works
- [ ] `http://localhost:8000/docs` shows FastAPI Swagger UI
- [ ] `http://localhost:3000` shows a "Road Warrior — Coming Soon" page
- [ ] `http://localhost:8000/api/health` returns `{"status": "ok"}`
- [ ] `alembic upgrade head` creates all tables on Neon
- [ ] `alembic downgrade base` cleanly drops everything
- [ ] All 5 tables (`riders`, `points_transactions`, `whatsapp_messages`, `whatsapp_sessions`, `admins`) exist with correct columns and indexes
- [ ] GIN index on `segments` works (`EXPLAIN` shows it being used)
- [ ] `.env.example` is comprehensive and documented
- [ ] All three root markdown docs are complete and helpful
- [ ] `docker-compose up` brings up the full local stack
- [ ] `make` shows a helpful help message with all targets

## 🧪 Manual Test Plan
1. Clone fresh repo
2. Copy `backend/.env.example` → `backend/.env` and fill Neon URL
3. Copy `frontend/.env.local.example` → `frontend/.env.local`
4. Run `make install`
5. Run `make db-migrate` → check Neon dashboard, all tables exist
6. Run `make docker-up`
7. Visit `http://localhost:8000/docs` → see Swagger
8. Visit `http://localhost:3000` → see landing placeholder
9. Hit `http://localhost:8000/api/health` → returns ok
10. Run `make db-rollback` → tables drop
11. Run `make db-migrate` → tables recreated

## 📦 Dependencies Introduced
**Backend:** fastapi, uvicorn, sqlalchemy, asyncpg, alembic, pydantic, pydantic-settings, python-jose, passlib, phonenumbers, qrcode, twilio, httpx
**Frontend:** next, react, react-dom, typescript, tailwindcss, next-intl
**Dev:** docker, docker-compose, pytest, ruff, black, mypy, eslint, prettier

## ⚠️ Risks & Notes
- **Neon free tier** has a ~0.5GB storage limit and auto-suspends after 5min inactivity. Document this in SETUP.md.
- **asyncpg requires SSL** for Neon — ensure `?sslmode=require` is in the DATABASE_URL.
- **No actual routes yet** — the API is intentionally empty. PR #2 fills this in.
- **WhatsApp libraries are installed** but not used yet (PR #4).
- **Admin password hashing** uses bcrypt via passlib — first admin will be seeded in a later PR.

## 🔗 Related PRs
- **PR #2:** Backend API + business logic (uses this schema)
- **PR #3:** Frontend pages and components (uses this scaffold)
- **PR #4:** WhatsApp integration (uses whatsapp_messages, whatsapp_sessions)
- **PR #5:** Extras (uses everything)

## 📊 Estimated Effort
- **Size:** M (Medium)
- **Files:** ~35 new files
- **Lines:** ~800 LOC (mostly config + schema)

---

**Reviewer focus areas:**
1. Database schema design — are the columns, types, and indexes right?
2. Project structure — does the monorepo layout make sense?
3. Env var design — is `pydantic-settings` the right choice?
4. Docker Compose — should we also include the frontend in Docker, or only use it for local DB?
5. Translation file strategy — is the placeholder approach OK or should we wait for PR #3?
