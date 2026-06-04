# 🛠️ SETUP — Local Development Guide

Step-by-step instructions to get Road Warrior running on your machine.

---

## ✅ Prerequisites

Install these first:

| Tool       | Version | Check        |
|------------|---------|--------------|
| Python     | 3.11+   | `python3 --version` |
| Node.js    | 20+     | `node --version`    |
| Docker     | 24+     | `docker --version`  |
| Make       | any     | `make --version`    |
| Git        | 2.30+   | `git --version`     |

> 💡 If you have **nvm**, run `nvm use 20` in the `frontend/` dir to get the right Node version.

Optional but recommended:
- [`pre-commit`](https://pre-commit.com/) — `pip install pre-commit && pre-commit install`
- A Neon account (free) — see below
- A Twilio account (only needed from PR #4 onwards)

---

## 🌐 1. Neon Database Setup (free)

1. Go to **https://neon.tech** and sign up (GitHub login is fastest).
2. Click **"Create a project"**.
   - Name: `road-warrior-dev`
   - Region: pick the one closest to you (e.g. `ap-southeast-1` for India)
   - Postgres version: **16**
3. Once the project is ready, click the **"Connection string"** dropdown and select **"asyncpg"**.
4. Copy the connection string. It will look like:
   ```
   postgresql+asyncpg://username:password@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/roadwarrior?sslmode=require
   ```
5. **Important:** make sure the URL includes `?sslmode=require` — asyncpg needs SSL to talk to Neon.
6. Save this string as `DATABASE_URL` for the next step.

### Neon free-tier caveats
- **~0.5 GB storage** — plenty for this MVP
- **Auto-suspends** after 5 min of inactivity — the first query after suspend takes ~500ms
- **1 project / 10 branches** on the free plan

---

## 📦 2. Clone & Configure

```bash
git clone <repo-url> road-warrior
cd road-warrior
```

### Backend env

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set at minimum:
```env
DATABASE_URL=postgresql+asyncpg://...neon.tech/...?sslmode=require
JWT_SECRET=any-long-random-string
```

### Frontend env

```bash
cp frontend/.env.local.example frontend/.env.local
```

Defaults are fine for local dev.

---

## 📥 3. Install Dependencies

```bash
make install
```

This runs:
- `pip install -r backend/requirements-dev.txt`
- `npm install` in `frontend/`

---

## 🗄️ 4. Run Database Migrations

```bash
make db-migrate
```

This is equivalent to `cd backend && alembic upgrade head`. It will create all 5 tables in your Neon database.

**Verify** in the Neon dashboard → your project → "Tables" — you should see:
- `riders`
- `points_transactions`
- `whatsapp_messages`
- `whatsapp_sessions`
- `admins`
- `alembic_version`

---

## 🚀 5. Start the App

### Option A — full Docker stack (recommended)
```bash
make docker-up
```
This brings up Postgres + FastAPI + Next.js in containers with hot-reload.

### Option B — run services locally
Open three terminals:
```bash
# Terminal 1 — local Postgres only
make db-up

# Terminal 2 — backend
make backend
# → http://localhost:8000

# Terminal 3 — frontend
make frontend
# → http://localhost:3000
```

---

## ✅ Verification

Run this 10-step smoke test:

| # | Action | Expected |
|---|--------|----------|
| 1 | `curl http://localhost:8000/api/health` | `{"status":"ok"}` |
| 2 | Open http://localhost:8000/docs | FastAPI Swagger UI loads |
| 3 | Open http://localhost:8000/redoc | ReDoc renders |
| 4 | Open http://localhost:3000 | "Road Warrior — Coming Soon" page |
| 5 | `make db-history` | Lists the initial migration |
| 6 | Neon dashboard → Tables | All 5 tables present |
| 7 | `make db-rollback` | All tables dropped |
| 8 | `make db-migrate` | All tables recreated |
| 9 | `make test` | Tests pass |
| 10 | `make lint` | No errors |

If all 10 pass, you're good to go. 🎉

---

## 🆘 Troubleshooting

### `alembic` cannot connect to the database
- Double-check `DATABASE_URL` ends with `?sslmode=require`
- Make sure the URL starts with `postgresql+asyncpg://` (not `postgres://`)
- Test with: `cd backend && python -c "import asyncio, asyncpg; asyncio.run(asyncpg.connect('...'))"`

### `asyncpg.exceptions.SSLRequired` 
Your `DATABASE_URL` is missing `?sslmode=require`. Add it.

### `docker compose` not found
- Newer Docker uses `docker compose` (no hyphen). If you only have `docker-compose`, install the Docker Compose v2 plugin.

### `make: command not found`
- macOS: `xcode-select --install`
- Ubuntu/Debian: `sudo apt install build-essential`
- Windows: use WSL2

### `npm install` fails on Apple Silicon
- Try `npm install --legacy-peer-deps`

### Port 3000 or 8000 already in use
Change the env var in your shell:
```bash
export FRONTEND_PORT=3001
export BACKEND_PORT=8001
make docker-up
```

### Neon connection times out
- Check if your project was suspended — visit the Neon dashboard to wake it
- Verify your IP is allowed (Neon allows all IPs by default)

### `pre-commit` hooks fail on first run
That's normal — they may auto-format files. Run `git add -A && git commit` again.

---

## 📚 Next Steps

Once setup is verified, read the PR specs in `prs/` and pick up the next one. Most work happens in `backend/app/` and `frontend/app/`.
