# 🔐 ENV — Environment Variables Reference

Every env var the Road Warrior app reads, with type, default, whether it's required, and an example.

> **All backend env vars live in `backend/.env`.** All frontend env vars live in `frontend/.env.local`. Never commit either of those files — only the `.example` templates.

---

## 🐘 Backend — Database

| Variable       | Type   | Default | Required | Example                                                                  | Notes                                          |
|----------------|--------|---------|----------|--------------------------------------------------------------------------|------------------------------------------------|
| `DATABASE_URL` | string | —       | ✅ yes   | `postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require` | Must use `postgresql+asyncpg://` and end with `?sslmode=require` for Neon. |

---

## 🔐 Backend — Auth / Security

| Variable           | Type   | Default | Required | Example                  | Notes                                            |
|--------------------|--------|---------|----------|--------------------------|--------------------------------------------------|
| `JWT_SECRET`       | string | —       | ✅ yes   | `9f4b...` (32+ bytes)    | HMAC key for JWT. Generate with `openssl rand -hex 32`. |
| `JWT_ALGORITHM`    | string | `HS256` | no       | `HS256`                  | JWT signing algorithm.                           |
| `JWT_EXPIRES_MIN`  | int    | `60`    | no       | `60`                     | Access-token lifetime in minutes.                |
| `ADMIN_BOOTSTRAP_TOKEN` | string | — | no | `temp-bootstrap-token-123` | One-time token to create the first admin via CLI. Required until first admin exists. |

---

## 🌐 Backend — CORS

| Variable        | Type            | Default                          | Required | Example                                            | Notes                                              |
|-----------------|-----------------|----------------------------------|----------|----------------------------------------------------|----------------------------------------------------|
| `CORS_ORIGINS`  | list of strings | `http://localhost:3000,http://localhost:8000` | no | `https://roadwarrior.app,https://www.roadwarrior.app` | Comma-separated. Include your prod frontend URL.   |

---

## 🌍 Backend — App / Misc

| Variable         | Type   | Default          | Required | Example                  | Notes                                                  |
|------------------|--------|------------------|----------|--------------------------|--------------------------------------------------------|
| `APP_ENV`        | enum   | `development`    | no       | `production`             | One of `development`, `staging`, `production`.         |
| `APP_NAME`       | string | `Road Warrior`   | no       | `Road Warrior`           | Used in OpenAPI metadata.                              |
| `APP_VERSION`    | string | `0.1.0`          | no       | `0.1.0`                  |                                                        |
| `LOG_LEVEL`      | enum   | `INFO`           | no       | `DEBUG`                  | `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`.       |
| `API_V1_PREFIX`  | string | `/api`           | no       | `/api`                   | All routes mounted under this prefix.                  |
| `DEFAULT_LANGUAGE` | enum | `en`             | no       | `en`                     | One of `en`, `hi`, `kn`.                              |

---

## 💬 Backend — Twilio / WhatsApp (PR #4)

These are installed in PR #1 but **not used until PR #4**. Set them to dummy values locally.

| Variable                  | Type   | Default | Required | Example                       | Notes                                          |
|---------------------------|--------|---------|----------|-------------------------------|------------------------------------------------|
| `WHATSAPP_MODE`           | enum   | `mock`  | no       | `twilio`                      | `mock` for dev (logs only), `twilio` in prod.  |
| `TWILIO_ACCOUNT_SID`      | string | —       | no*      | `ACxxxxxxxxxxxxxxxxxxxxxxxx`  | *Required when `WHATSAPP_MODE=twilio`.         |
| `TWILIO_AUTH_TOKEN`       | string | —       | no*      | `your_auth_token`             |                                                |
| `TWILIO_WHATSAPP_FROM`     | string | —       | no*      | `whatsapp:+14155238886`       | Sandbox or approved sender.                    |
| `TWILIO_WEBHOOK_URL`      | string | —       | no       | `https://api.roadwarrior.app/api/v1/whatsapp/webhook` | Must be HTTPS.                |

---

## 🚀 Feature flags

| Variable                     | Type | Default | Example | Notes                                |
|------------------------------|------|---------|---------|--------------------------------------|
| `ENABLE_REFERRAL_PROGRAM`    | bool | `true`  | `true`  | Toggles the points/referral engine.  |
| `ENABLE_WHATSAPP_BOT`        | bool | `false` | `true`  | Off in dev unless you're testing PR #4. |
| `ENABLE_ADMIN_DASHBOARD`     | bool | `true`  | `true`  | Toggles admin routes (PR #2).        |

---

## 🎨 Frontend — Next.js

All frontend env vars exposed to the browser MUST be prefixed with `NEXT_PUBLIC_`.

| Variable                  | Type   | Default                  | Required | Example                                | Notes                                |
|---------------------------|--------|--------------------------|----------|----------------------------------------|--------------------------------------|
| `NEXT_PUBLIC_API_URL`     | string | `http://localhost:8000`  | no       | `https://api.roadwarrior.app`          | Base URL for backend API calls.      |
| `NEXT_PUBLIC_APP_NAME`    | string | `Road Warrior`           | no       | `Road Warrior`                         |                                      |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | enum | `en`                    | no       | `en`                                   | One of `en`, `hi`, `kn`.             |
| `NEXT_PUBLIC_SITE_URL`    | string | `http://localhost:3000`  | no       | `https://roadwarrior.app`              | Used for OG tags, share URLs.         |

### Frontend — non-public (server-side only, optional)

| Variable        | Type   | Default | Example                | Notes                                 |
|-----------------|--------|---------|------------------------|---------------------------------------|
| `ANALYTICS_KEY` | string | —       | `G-XXXXXXXXXX`         | GA4 / Plausible key (if added later). |

---

## 🧪 Quick local-dev `.env` template

```env
# backend/.env
APP_ENV=development
LOG_LEVEL=DEBUG
DATABASE_URL=postgresql+asyncpg://roadwarrior:roadwarrior@localhost:5432/roadwarrior
JWT_SECRET=dev-secret-change-me-please
CORS_ORIGINS=http://localhost:3000
WHATSAPP_MODE=mock
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

---

## ❓ FAQ

**Q: Can I use `postgres://` instead of `postgresql+asyncpg://`?**
A: No. The `+asyncpg` part tells SQLAlchemy 2.0 to use the async driver. Without it you'll get `MissingGreenlet` errors.

**Q: Why must `DATABASE_URL` end with `?sslmode=require`?**
A: Neon requires SSL. Without it, asyncpg refuses to connect.

**Q: I get `ValidationError` on startup. What now?**
A: Some required var is missing or wrong type. The error message names it explicitly.

**Q: Do I need to set Twilio vars for local dev?**
A: No — `WHATSAPP_MODE=mock` makes the WhatsApp module log instead of send. PR #4 uses real Twilio.
