# PR #5 — Extras, CI/CD, Deployment, Monitoring & Production Hardening

## 🎯 Goal
Take the working system from PR #1-4 to **production-ready**. This PR bundles everything that isn't core feature work: CI/CD pipelines, deployment configs, monitoring/observability, e2e tests, offline mode, security hardening, performance optimization, and the "polish" features that make the difference between a demo and a launchable product.

After this PR, you can:
- Push to `main` → auto-deploys to production
- Open a PR → runs full test suite + e2e tests
- See errors in Sentry
- See performance in PostHog
- Riders can use the form **offline** (PWA)
- Admin can see a real-time cost dashboard for Twilio
- The system can handle 10K concurrent form submissions

## 📋 Scope

### Production Infrastructure
- Dockerfile for backend (multi-stage, slim)
- Dockerfile for frontend (Next.js standalone output)
- GitHub Actions CI/CD
- Production deployment guide for backend (Fly.io / Railway)
- Production deployment guide for frontend (Vercel)
- Neon production setup with branching
- Custom domain + SSL

### Observability
- Structured logging (JSON logs)
- Sentry error tracking (backend + frontend)
- PostHog product analytics
- Health check + readiness/liveness endpoints
- Twilio cost monitoring dashboard
- Uptime monitoring (UptimeRobot / BetterStack)

### Security & Performance
- Rate limiting (per IP, per phone)
- CORS hardening
- Security headers (CSP, HSTS, etc.)
- Input sanitization
- SQL injection prevention (already handled by SQLAlchemy)
- Database connection pooling tuning
- Redis caching layer for hot data (stats, leaderboard)
- Background job queue (ARQ) for WhatsApp sends
- Database query optimization (indexes, materialized views for stats)

### Bonus Features
- **Kannada auto-detection** by city (Bangalore → default to Kannada)
- **Offline mode** for the form (PWA with IndexedDB queue)
- **Real-time leaderboard** updates via Server-Sent Events
- **Email digests** for admins (daily hot leads summary)
- **Public stats page** (anonymous, marketing-friendly)
- **A/B testing** for welcome message variations
- **Geolocation** (optional, "nearest hub" feature)

### Testing
- E2E tests with Playwright (form flow, admin login, dashboard)
- Load testing with Locust
- Visual regression tests for key pages
- Security audit (Bandit, npm audit)

## 🔗 Depends On
- **PR #1** ✅
- **PR #2** ✅
- **PR #3** ✅
- **PR #4** ✅

## 📁 Files to Create/Modify (top-level)

```
.github/
├── workflows/                               # CI/CD pipelines
├── ISSUE_TEMPLATE/
├── PULL_REQUEST_TEMPLATE.md
├── CODEOWNERS
└── dependabot.yml

docker-compose.prod.yml                      # Production-like local stack
docker-compose.yml                           # Updated with Redis + worker
nginx/                                       # Reverse proxy configs
ops/                                         # Monitoring, runbooks, deploy scripts
```


## 📁 Files (continued)

```
backend/                                    # Production-hardened
├── Dockerfile                               # Multi-stage
├── .dockerignore
├── app/
│   ├── main.py                              # Startup/shutdown events
│   ├── config.py                            # Sentry, PostHog, Redis config
│   ├── logging_config.py                    # Structured JSON logs
│   ├── middleware/
│   │   ├── rate_limit.py                    # slowapi
│   │   ├── security_headers.py              # CSP, HSTS
│   │   ├── request_id.py                    # Tracing
│   │   └── logging.py                       # Request/response logs
│   ├── monitoring/
│   │   ├── sentry.py                        # Sentry init
│   │   ├── posthog.py                       # PostHog init
│   │   └── metrics.py                       # Prometheus
│   ├── cache/redis.py                       # Redis client + decorators
│   ├── jobs/
│   │   ├── queue.py                         # ARQ worker
│   │   ├── whatsapp_sender.py               # Async WhatsApp
│   │   ├── milestone_checker.py
│   │   ├── daily_digest.py                  # Admin email
│   │   └── session_cleaner.py
│   ├── services/
│   │   ├── email.py                         # Resend/SendGrid
│   │   ├── background_tasks.py
│   │   └── analytics.py
│   ├── api/
│   │   ├── health.py                        # /healthz, /readyz, /metrics
│   │   ├── public_stats.py                  # Anonymous stats
│   │   └── sse.py                           # Server-Sent Events
│   └── models/admin.py                      # Audit log fields
├── tests/
│   ├── e2e/                                 # Playwright Python
│   ├── load/locustfile.py
│   ├── security/test_security.py
│   └── conftest.py                          # Redis container
├── scripts/
│   ├── backup_db.sh
│   ├── restore_db.sh
│   └── smoke_test.sh
├── alembic/versions/0002_add_indexes.py
├── gunicorn_conf.py
├── pyproject.toml
├── .bandit
└── requirements-prod.txt

frontend/                                   # PWA + monitoring
├── Dockerfile                               # Standalone Next.js
├── public/
│   ├── sw.js                                # Full offline SW
│   ├── offline.html
│   └── icons/                               # All PWA sizes
├── app/
│   ├── layout.tsx                           # Sentry, PostHog, SEO
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── opengraph-image.tsx                  # Dynamic OG
│   ├── [lang]/offline/page.tsx              # Cached form
│   └── admin/settings/page.tsx
├── components/
│   ├── offline/
│   │   ├── OfflineIndicator.tsx
│   │   ├── OfflineQueueManager.tsx
│   │   └── InstallPrompt.tsx
│   └── common/
│       ├── ErrorBoundary.tsx
│       └── AnalyticsProvider.tsx
├── lib/
│   ├── analytics.ts
│   ├── offline-db.ts                        # IndexedDB
│   ├── sw-register.ts
│   └── sentry.ts
├── e2e/
│   ├── playwright.config.ts
│   ├── tests/{form,referral,score,admin,offline}.spec.ts
│   └── fixtures/
├── next.config.js                           # Security headers
└── package.json                             # sentry, posthog, idb, playwright
```


## 🏗️ Infrastructure & Deployment

### Backend Dockerfile (multi-stage)
```dockerfile
# Stage 1: builder
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# Stage 2: runtime
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/*
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# Non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["gunicorn", "app.main:app", "-c", "gunicorn_conf.py", "-k", "uvicorn.workers.UvicornWorker"]
```
Final image size: ~180MB

### Frontend Dockerfile (Next.js standalone)
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### GitHub Actions

**`ci.yml`** (runs on every PR):
```yaml
name: CI
on: [pull_request]
jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r backend/requirements-dev.txt
      - run: cd backend && pytest --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v4

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run lint && npm run test
      - run: cd frontend && npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d
      - uses: actions/setup-python@v5
      - run: pip install playwright pytest-playwright
      - run: playwright install
      - run: pytest backend/tests/e2e/
```

**`cd-backend.yml`** (runs on push to main):
- Builds Docker image
- Pushes to GitHub Container Registry
- Deploys to Fly.io via `flyctl deploy`
- Runs `scripts/smoke_test.sh` against production
- Rolls back on health check failure

**`cd-frontend.yml`** (runs on push to main):
- Builds Next.js
- Deploys to Vercel
- Runs Lighthouse CI on preview URL
- Posts comment to PR with score

### Deployment Targets

**Backend: Fly.io** (recommended)
- `fly.toml` config
- Auto-scaling 1-4 machines
- Postgres connection via Fly's private network to Neon
- Health check at `/healthz`
- Region: `sin` (Singapore, closest to India)

**Frontend: Vercel**
- Auto-detected Next.js project
- Edge functions for `/api/*` routes (none in our case, backend handles)
- ISR for landing pages
- Preview deployments per PR

**Database: Neon**
- Production branch
- Staging branch (auto-deployed from `develop`)
- Daily automated backups (Neon feature)
- Connection pooling enabled
- Read replica for heavy analytics queries (optional)

### Environment Strategy

| Branch | Backend | Frontend | DB |
|---|---|---|---|
| `main` | Production (Fly.io) | Production (Vercel) | Neon main branch |
| `develop` | Staging (Fly.io) | Staging (Vercel) | Neon staging branch |
| PR branches | PR preview (Fly machines) | Vercel preview | Neon branch (auto-created) |


## 📊 Observability & Monitoring

### Structured Logging
- All logs in JSON format (for easy ingestion by Datadog/Loki/CloudWatch)
- Includes: timestamp, level, request_id, user_id (if any), endpoint, status, duration, message
- Sensitive fields (phone, password) auto-redacted
- Log levels: DEBUG (dev only), INFO, WARNING, ERROR, CRITICAL

Example log line:
```json
{"ts":"2026-01-15T10:23:45.123Z","level":"info","request_id":"abc-123","endpoint":"POST /api/riders/submit","status":201,"duration_ms":234,"rider_id":"uuid","city":"Bangalore","msg":"rider_created"}
```

### Sentry (Error Tracking)
- Backend: `sentry-sdk[fastapi]` auto-instruments FastAPI + SQLAlchemy
- Frontend: `@sentry/nextjs` with browser + Node runtimes
- Source maps uploaded on build
- Alerts on Slack for new errors
- Performance traces for slow endpoints (> 1s)
- Custom tags: `env`, `version`, `region`

### PostHog (Product Analytics)
- Tracks key events:
  - `form_started`
  - `form_section_completed` (with section name)
  - `form_abandoned` (with last section)
  - `form_submitted` (with city, vehicle_type, language)
  - `referral_shared` (with method: whatsapp, copy, qr)
  - `score_checked`
  - `milestone_reached`
  - `language_changed`
- Funnels: form start → submit (drop-off analysis per section)
- Cohorts: by city, vehicle type, language
- Session recordings (sampled at 10%) for UX research

### Prometheus Metrics
- `http_requests_total{endpoint, method, status}` — counter
- `http_request_duration_seconds{endpoint, method}` — histogram
- `db_query_duration_seconds{query_type}` — histogram
- `whatsapp_sends_total{template, language, status}` — counter
- `whatsapp_send_duration_seconds{template}` — histogram
- `active_riders_total` — gauge
- `background_jobs_pending{queue}` — gauge
- `background_jobs_failed_total{job_type, error}` — counter

Endpoint: `GET /metrics` (Prometheus format, no auth, internal only)

### Health Endpoints
- `GET /healthz` — liveness, returns 200 if process is up
- `GET /readyz` — readiness, checks DB + Redis connectivity
- `GET /metrics` — Prometheus

### Uptime Monitoring
- BetterStack or UptimeRobot pings `/healthz` every 60s
- 2 regions (Singapore, Mumbai)
- Slack alert on 2 consecutive failures
- Status page: `status.roadwarrior.in` (public)

### Twilio Cost Dashboard
- Custom Grafana panel showing:
  - Messages sent today / this month
  - Cost estimate (₹)
  - Success rate
  - Top templates by volume
- Alert if cost > ₹5,000 in a day


## 🔒 Security & Performance Hardening

### Rate Limiting (`middleware/rate_limit.py`)
- Using `slowapi` with Redis backend
- Per-endpoint rules:
  - `POST /api/riders/submit`: 5/min per IP, 20/hour per phone
  - `POST /api/riders/validate-referral/*`: 30/min per IP
  - `GET /api/riders/score`: 10/min per IP
  - `POST /api/admin/login`: 5/min per IP (anti-brute force)
  - Everything else: 60/min per IP
- 429 response with `Retry-After` header

### Security Headers (`middleware/security_headers.py`)
```python
response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.posthog.com https://*.sentry.io"
response.headers["X-Frame-Options"] = "DENY"
response.headers["X-Content-Type-Options"] = "nosniff"
response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
```

### CORS Hardening
- Whitelist specific origins (no wildcard in prod)
- Credentials enabled for admin cookie
- Preflight cached for 24h

### Input Sanitization
- All string inputs: trim + strip control chars
- Phone: validated AND normalized (E.164)
- Free text (brand_model, notes): max 200 chars, no HTML
- IDs (UUIDs): strict regex check
- Arrays (challenges, motivators): max 10 items, each from whitelist

### Database Performance
- New indexes in `0002_add_indexes.py`:
  - Composite: `(city, vehicle_type, created_at DESC)` for filtered listings
  - Partial: `WHERE is_duplicate = false` for unique rider counts
  - Expression: `LOWER(phone)` for case-insensitive lookups
- Materialized view: `mv_daily_signups` (refreshed hourly) for chart
- Materialized view: `mv_top_referrers` (refreshed every 15 min)
- Connection pool: `pool_size=5, max_overflow=10` per app instance, Neon's `?pgbouncer=true` mode

### Redis Caching (`cache/redis.py`)
- Cache keys:
  - `stats:overview` — 5 min TTL
  - `leaderboard:top50` — 5 min TTL
  - `referrer:count:{code}` — 1 hour TTL
  - `rate_limit:*` — per-rule TTL
- Decorator: `@cached(ttl=300, key_prefix="stats")`
- Cache invalidation on rider create/update (via pub/sub)
- Falls back to DB on Redis miss

### Background Jobs (`jobs/queue.py`)
- **ARQ** (async Redis queue) for:
  - WhatsApp sends (so form submission is fast even if Twilio is slow)
  - Daily admin digest email
  - Session cleanup
  - Stats recomputation
- Worker runs as separate process: `arq app.jobs.queue.WorkerSettings`
- Auto-retry with exponential backoff (3 attempts)
- Dead-letter queue for failed jobs


## ✨ Bonus Features (Beyond Original Requirements)

### 1. Kannada Auto-Detection
- When user picks city = "Bangalore" in Section A, auto-suggest Kannada as language
- Toast: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ನಾವು ಕನ್ನಡದಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಹುದು! ಬದಲಾಯಿಸಲು ಇಲ್ಲಿ ಒತ್ತಿ" with a "Switch" button
- Persists choice for next visit
- Same for Hyderabad → Telugu (future), Chennai → Tamil (future)

### 2. Offline Form Mode (PWA)
- Service worker caches form HTML, JS, CSS, and translation files
- Form saves draft to IndexedDB on every change
- If offline, "Submit" button changes to "Save & Submit Later"
- When back online, queue manager POSTs all pending submissions in order
- Toast: "You're offline. Your response is saved and will submit when you reconnect."
- All 3 languages supported offline
- Install prompt: "Add Road Warrior to your home screen for faster access" (after 1st submit)

### 3. Real-time Leaderboard (SSE)
- `GET /api/admin/leaderboard/stream` returns Server-Sent Events
- Admin leaderboard page subscribes via `EventSource`
- When a new milestone is reached anywhere in the system, the live leaderboard animates
- Implementation: Redis pub/sub on rider create → SSE push to subscribers

### 4. Daily Admin Email Digest
- Sent at 9 AM IST every day
- Contains:
  - Yesterday's signups (with city breakdown)
  - New hot leads count
  - Top 3 referrers of the day
  - Twilio spend yesterday
  - Any failed messages count
- Sent via Resend to all admin emails
- Unsubscribe link per admin

### 5. Public Stats Page — `roadwarrior.in/stats`
- Anonymous, no PII
- Shows: total riders, % EV vs petrol, top 5 cities, total points awarded
- Updates every 5 minutes (ISR)
- "Join the movement" CTA → links to form
- Embeddable widget for partner sites

### 6. A/B Testing for Welcome Messages
- Each rider randomly assigned to variant A or B (50/50)
- Variant A: shorter welcome message
- Variant B: includes "5 riders already joined today!" social proof
- Track: referral rate per variant
- Admin can view results in `/admin/experiments`

### 7. Geolocation (Optional)
- "Find nearest charging hub" feature on the score page
- Uses browser geolocation (with permission)
- Returns top 3 nearest hubs (curated list, hardcoded for MVP)
- If user denies permission, just hides the feature gracefully


## 🧪 Testing Strategy

### E2E Tests (Playwright)
**Backend E2E** (`tests/e2e/` with pytest-playwright):
- `test_form_flow.py` — full form submission, all 6 sections, all 3 languages
- `test_referral_flow.py` — 11 riders (1 + 10 referrals), milestone 10 triggered
- `test_admin_flow.py` — login, view dashboard, export CSV, retry message
- `test_offline_form.py` — simulate offline, submit, go online, verify sync
- `test_whatsapp_flow.py` — Twilio sandbox E2E (requires real creds, marked `@pytest.mark.integration`)

**Frontend E2E** (`e2e/tests/` with Playwright):
- `form.spec.ts` — UI flow, validation, conditional sections
- `referral.spec.ts` — share buttons, QR display
- `score.spec.ts` — lookup, milestone progress
- `admin.spec.ts` — login, dashboard loads, filters work
- `offline.spec.ts` — install prompt, offline submission
- Visual regression snapshots for key screens

### Load Testing (Locust)
**`tests/load/locustfile.py`**:
```python
class RiderUser(HttpUser):
    wait_time = between(1, 5)

    @task
    def submit_form(self):
        self.client.post("/api/riders/submit", json={
            "full_name": f"User {random_string()}",
            "phone": f"9{random.randint(100000000, 999999999)}",
            "city": random.choice(CITIES),
            ...
        })

    @task(3)
    def check_score(self):
        self.client.get(f"/api/riders/score?phone=+91{random.randint(...)}")

    @task
    def get_qr(self):
        self.client.get(f"/api/riders/qr/{random_code()}.png")
```
**Scenarios:**
- Baseline: 100 concurrent users, 10 min → < 1% error rate
- Peak: 1000 concurrent users, 5 min → < 5% error rate
- Spike: 0 → 5000 users in 30s → graceful degradation

### Security Tests
- `test_security.py`:
  - SQL injection attempts in all string fields
  - XSS payloads in brand_model field
  - Path traversal in QR endpoint
  - Auth bypass on admin endpoints
  - JWT tampering detection
  - Rate limit enforcement
  - CORS preflight from disallowed origin
  - File upload (no file uploads in this app, but ensure endpoints reject)

### Visual Regression (Percy or Chromatic)
- Snapshot landing page (3 languages)
- Snapshot form (each section)
- Snapshot admin dashboard
- Snapshot success page
- Run on every PR; fail if pixel diff > 0.1%

## 📚 Documentation Deliverables

| File | Content |
|---|---|
| `README.md` | Updated with badges, live demo link, screenshots |
| `SETUP.md` | Local dev guide (from PR #1, expanded) |
| `DEPLOYMENT.md` | Production deploy (Fly.io + Vercel + Neon) |
| `WHATSAPP_SETUP.md` | From PR #4, plus Meta approval walkthrough |
| `ARCHITECTURE.md` | ✨ New — system diagram, data flow, design decisions |
| `RUNBOOKS.md` | ✨ New — incident response, common ops tasks |
| `API.md` | OpenAPI link + endpoint examples |
| `ENV.md` | Complete env var reference |
| `CHANGELOG.md` | ✨ New — semantic versioning |
| `CONTRIBUTING.md` | ✨ New — dev workflow, PR process |
| `SECURITY.md` | ✨ New — vulnerability disclosure, security model |


## 📋 Updated Makefile Targets

```makefile
# Dev (existing)
make install
make backend
make frontend
make test

# PR #5 additions
make build                  # Build both Docker images
make build-backend
make build-frontend
make push                   # Push to registry

make deploy-backend         # Deploy to Fly.io
make deploy-frontend        # Deploy to Vercel
make deploy                 # Deploy both

make e2e                    # Run Playwright tests
make e2e-ui                 # Playwright in UI mode
make load-test              # Run Locust
make security-audit         # Bandit + npm audit
make visual-test            # Percy snapshot tests

make redis                  # Start Redis container
make worker                 # Start ARQ worker
make logs                   # Tail logs from all services
make db-stats               # Show table sizes, slow queries
make cache-clear            # Flush Redis

make backup-db              # Snapshot Neon to S3
make restore-db FILE=...    # Restore from snapshot

make env-check              # Verify all required env vars set
make health                 # Curl all health endpoints
```

## ✅ Acceptance Criteria

### CI/CD
- [ ] Opening a PR triggers `ci.yml` — all tests pass
- [ ] PR gets a Vercel preview URL with Lighthouse score comment
- [ ] Merging to `main` triggers `cd-backend.yml` and `cd-frontend.yml`
- [ ] Production deploys complete in < 5 min
- [ ] Health check smoke test runs after deploy
- [ ] Failed deploys auto-rollback

### Observability
- [ ] All logs are valid JSON with `request_id`
- [ ] Sentry receives errors from both backend and frontend
- [ ] PostHog shows form_started, form_submitted events
- [ ] Prometheus `/metrics` returns 200 with expected metrics
- [ ] `/healthz` returns 200 in < 10ms
- [ ] `/readyz` returns 503 if DB is down
- [ ] Grafana dashboard shows real-time data
- [ ] Alerts fire in Slack on test conditions

### Security & Performance
- [ ] Rate limit returns 429 after threshold
- [ ] All security headers present in responses (test with securityheaders.com)
- [ ] Submit endpoint handles 1000 req/min without errors (load test)
- [ ] Median submit latency < 200ms (p95 < 500ms)
- [ ] Redis cache hit rate > 70% on stats endpoints
- [ ] Lighthouse mobile score > 90 on landing, form, success, score
- [ ] Bandit reports 0 high-severity issues
- [ ] npm audit reports 0 high-severity issues

### Bonus Features
- [ ] Picking Bangalore auto-suggests Kannada
- [ ] Form works offline (PWA installed, airplane mode test)
- [ ] Offline submissions sync when back online
- [ ] Admin leaderboard updates in real-time (within 2s of new milestone)
- [ ] Daily digest email arrives at 9 AM IST
- [ ] `/stats` page works without auth and shows real data
- [ ] A/B test variants randomly assigned
- [ ] Geolocation feature gracefully hides if denied

### Testing
- [ ] All E2E tests pass on PR
- [ ] Load test baseline passes
- [ ] Security tests pass
- [ ] Visual regression tests pass

## 📊 Estimated Effort
- **Size:** XL (Extra Large)
- **Files:** ~80 new + 30 modified
- **Lines:** ~4,000 LOC
- **Test cases:** ~50 new

## ⚠️ Risks & Notes
- **Cost monitoring**: Sentry, PostHog, BetterStack, Resend all have free tiers; paid tiers at scale ≈ $200-500/month
- **Fly.io pricing**: ~$10-30/month for our traffic
- **Vercel pricing**: free tier covers our needs
- **Neon pricing**: free tier → pro at scale ($19/month for 10GB)
- **Secret management**: Use Fly.io secrets + Vercel env vars; never commit .env
- **GDPR/data residency**: All data stays in India region (Singapore DC for Fly, Mumbai for Vercel Edge, Neon has Mumbai region)
- **Backup strategy**: Neon auto-backup + weekly manual export to S3
- **Disaster recovery**: RTO 1h, RPO 15min — documented in RUNBOOKS.md

## 🔗 Related PRs
- **PR #1** ✅ — foundational infra
- **PR #2** ✅ — backend API
- **PR #3** ✅ — frontend
- **PR #4** ✅ — WhatsApp

---

**Reviewer focus areas:**
1. Deployment target — Fly.io vs Railway vs Render vs AWS for backend?
2. Monitoring stack — is Sentry + PostHog + Grafana overkill, or just right?
3. Offline mode — is the IndexedDB complexity worth it for our user base?
4. Rate limiting thresholds — too strict (annoys users) vs too loose (gets abused)?
5. Daily digest — useful or noise? Should it be opt-in for admins?
6. A/B testing — premature optimization, or solid data-driven foundation?
7. Visual regression — necessary for a mostly-text app, or over-engineering?
8. CI/CD complexity — GitHub Actions vs GitLab CI vs CircleCI?
