---
name: mvp-paas-auth-oauth
description: Reusable auth + Google OAuth checklist for MVP projects on this stack (Next.js + FastAPI + Neon + Vercel + Render). Use when setting up sign-in, JWT, bcrypt limits, Google sign-in, env vars, or copying this template to a new app.
---

> **Greenfield “create an app and deploy”:** see **`create-app-and-deploy`** for the full pipeline; this skill is the **auth/OAuth** chapter.

# MVP: Auth, JWT, bcrypt, and Google OAuth (PaaS template)

Use this for **every new MVP** that starts from `paas-full-template` or the same stack.

## Stack (what ships in the template)

| Layer | Role |
|-------|------|
| **Next.js (Vercel)** | UI, `/api/auth/*` routes that proxy to FastAPI or use DB directly when `API_BACKEND_URL` is unset |
| **FastAPI (Render)** | Register, login, JWT issue, **Google OAuth** start + callback |
| **Neon (Postgres)** | `users` with optional `google_id`, `email`; migration `002_oauth.sql` |
| **JWT cookie** | Same `JWT_SECRET` on Vercel + Render |

## Environment variables (checklist)

### Vercel (frontend)

- `API_BACKEND_URL` — `https://<your-backend>.onrender.com` (no trailing slash)
- `JWT_SECRET` — same string as Render (min ~32 chars)

Use `.\scripts\vercel-env-set-api.ps1 -ProjectName <app>` so **team** projects get vars (CLI alone often targets wrong scope).

### Render (backend)

- `DATABASE_URL` — Neon connection string
- `JWT_SECRET` — same as Vercel
- `GOOGLE_CLIENT_ID` — Web client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — Web client secret
- `FRONTEND_URL` — **exact** production URL users open (e.g. `https://your-app-xxx.vercel.app`). Used after OAuth to redirect to `/api/auth/oauth-callback?token=...`
- `RENDER_EXTERNAL_URL` — set automatically by Render to the service URL (used for OAuth **redirect_uri** in Google token exchange)

### Local `.env`

Mirror the above for local dev. For Google OAuth local testing, add redirect URI `http://localhost:10000/api/auth/google/callback` in Google Console.

## Google Cloud Console (one-time per OAuth client)

Google has **no API** to create clients programmatically — human step in the browser.

1. **APIs & Services → Credentials → Create OAuth client → Web application**
2. **Authorized JavaScript origins**  
   - Production: `FRONTEND_URL` (e.g. `https://library-….vercel.app`)  
   - Local: `http://localhost:3000`
3. **Authorized redirect URIs** (must be the **backend**, not Vercel)  
   - Production: `https://<BACKEND>/api/auth/google/callback`  
   - Local: `http://localhost:10000/api/auth/google/callback`
4. Copy **Client ID** and **Client secret** into `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Authorized JavaScript origins — common mistake

- **Do not** use `https://console.cloud.google.com` — that is the admin UI, not your app. Google Sign-In will fail or behave oddly for users.
- **Do** list every URL where the **browser** loads your Next.js app, e.g.  
  `https://<your-project>-<team>.vercel.app` and optionally `https://short-name.vercel.app` if that domain points here.  
  Add `http://localhost:3000` for local dev.

### After you have Client ID + Secret (next steps)

1. Set in **repo root `.env`** (never commit `.env`):  
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and **`FRONTEND_URL`** = the **exact** URL users open in the browser after deploy (usually the long Vercel team URL, not necessarily `projectName.vercel.app`).
2. Run **`.\scripts\oauth-setup-render.ps1`** — pushes OAuth + `FRONTEND_URL` to Render, runs DB migration if needed, triggers **Render deploy**.
3. Confirm **Vercel** has `API_BACKEND_URL` + `JWT_SECRET` (`.\scripts\vercel-env-set-api.ps1 -ProjectName <app>`), then redeploy frontend if you changed env.
4. Test: **Sign in with Google** on `/login` — should return to `FRONTEND_URL/api/auth/oauth-callback?token=...` then dashboard.
5. If the client secret was ever pasted in chat or a ticket, **rotate** it in Google Console → Credentials → client → Reset secret, update `.env`, run `oauth-setup-render.ps1` again.

## Scripts (automate what can be automated)

| Script | Purpose |
|--------|---------|
| `.\scripts\oauth-setup-render.ps1` | Reads OAuth vars from `.env`, sets them on the Render service (`RENDER_BACKEND_SERVICE_ID`), runs DB migrations, triggers **Render deploy** |
| `.\scripts\nanoclaw-deploy.ps1 -AppName <app>` | Full path: DB migrations, Render env sync + deploy, Vercel env API + frontend deploy |
| `.\scripts\render-setup-backend.ps1` | Create/update `*-api` service, sync env from `.env` |

After editing `.env` with Google keys: run **`oauth-setup-render.ps1`**, then confirm **FRONTEND_URL** matches the URL in the browser (especially for **team** Vercel URLs — not always `projectName.vercel.app`).

## OAuth flow (how it works)

1. User clicks **Sign in with Google** or **Continue with Google** → `GET /api/auth/google` (Next.js) → **302** to `API_BACKEND_URL/api/auth/google`
2. Backend redirects to Google consent
3. Google redirects to **`https://<backend>/api/auth/google/callback`**
4. Backend exchanges code, loads/creates user, issues JWT, redirects to **`FRONTEND_URL/api/auth/oauth-callback?token=...`**
5. Next.js route sets cookie and redirects to `/dashboard`

If **`FRONTEND_URL`** is wrong, the user lands on the wrong host or gets CORS/cookie issues. If **redirect URI** in Google does not match the backend callback **exactly**, Google returns `redirect_uri_mismatch`.

## Password hashing (bcrypt 72-byte limit)

- **Backend:** `backend/auth_bcrypt.py` — `bcrypt.hashpw` / `checkpw` on **≤72 UTF-8 bytes** (never pass long strings through passlib for passwords).
- **Frontend (direct DB mode):** `frontend/lib/passwordBcrypt.ts` — safe truncation for `bcryptjs`.
- **Docker:** `backend/Dockerfile` runs `scripts/verify_bcrypt_limits.py` so broken builds fail fast.

## UI surfaces

- **Login:** `GoogleSignInButton` when `API_BACKEND_URL` is set (`login/page.tsx`).
- **Register:** same — **Continue with Google** creates/links user on first OAuth (same backend callback).

## New MVP from this template — minimal auth checklist

- [ ] Copy `.env.example` → `.env`; set Neon, Render, Vercel tokens, `DATABASE_URL`, `JWT_SECRET`
- [ ] Create GitHub repo, push, run `nanoclaw-deploy.ps1` (or equivalent) — get backend URL
- [ ] Set `vercel-env-set-api.ps1` for `API_BACKEND_URL` + `JWT_SECRET`
- [ ] Google OAuth client + redirect URIs + secrets in `.env`
- [ ] `FRONTEND_URL` = real production frontend URL (check team alias if needed)
- [ ] Run `oauth-setup-render.ps1`
- [ ] Test: email/password login, logout, Google sign-in from login **and** register pages

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `redirect_uri_mismatch` | Redirect URI in Google ≠ backend URL + path; or http vs https |
| OAuth works but wrong app / no cookie | `FRONTEND_URL` mismatch |
| "Google OAuth not configured" on backend | Missing `GOOGLE_CLIENT_ID` on Render; run `oauth-setup-render.ps1` |
| Sign-in with Google missing on UI | `API_BACKEND_URL` empty on Vercel — run `vercel-env-set-api.ps1` and redeploy |

## Related docs in repo

- `OAUTH_SETUP.md` — step-by-step Google Console screenshots-style instructions
- `VERCEL_ENV.md` — Vercel env vars
- `AUTOMATION_HURDLES.md` — platform quirks
- `LIBRARY_REQUIREMENTS.md` — how the Library MVP maps to typical ILS expectations (catalog, circulation, seed data)

## Related skills

- `workflow-deploy-vercel-git` — deploy + Git link + team URL
- `monitor-logs-and-fix` — errors after deploy
