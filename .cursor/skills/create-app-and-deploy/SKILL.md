---
name: create-app-and-deploy
description: End-to-end playbook for a new MVP from this paas-full-template—topic-specific app, DB, FastAPI, Next.js, Neon, Render, Vercel. Use when the user says create an app, build and deploy, new project from this template, or deploy my app for topic X.
---

# Create an app from this template and deploy it

Use this skill whenever the user wants a **new product** built on this repo (or a copy) **and** deployed like Library/Habit—**not** only a redeploy of the same app.

## What “done” looks like

- **Topic** reflected in schema, APIs, and UI (not leftover “Library”/“Habit” copy unless intentional).
- **Neon**: migrations applied (`db/migrations/*.sql` in order).
- **Render**: FastAPI service `<AppName>-api` with env vars.
- **Vercel**: Next.js `frontend/` with `API_BACKEND_URL` + `JWT_SECRET` (via API: `vercel-env-set-api.ps1`).
- User gets **frontend URL**, **backend URL**, **OAuth redirect URI** (if using Google), and any **one-time** manual steps.

## Phase 1 — Clarify (30 seconds)

1. **App name** — lowercase slug for scripts: e.g. `inventory`, `crm`, `events` (used as `-AppName` and often as GitHub repo name).
2. **Topic** — one sentence: what entities and user actions (e.g. “staff roster + shifts”, “invoices + clients”).
3. **Auth** — keep email/password + JWT + optional Google OAuth (default for this template).

## Phase 2 — Adapt the codebase (topic-specific)

| Area | What to change |
|------|----------------|
| **Branding** | `frontend/app/page.tsx`, layout, nav, metadata; remove wrong product name. |
| **Database** | New numbered files in `db/migrations/` (e.g. `005_*.sql`). Keep `users` + `002_oauth.sql` pattern if using Google. Run `node db/run-all-migrations.js` locally to verify. |
| **Backend** | `backend/routers/*.py`, `backend/schemas.py`, register routers in `main.py`. Reuse patterns: `get_db_pool`, `get_current_user`, `auth_bcrypt` for passwords. |
| **Frontend** | `frontend/app/` routes, `frontend/app/api/*` route handlers that proxy to FastAPI when `useBackend()`. |
| **Docs** | Optional `<TOPIC>_APP_SUMMARY.md` or section in `README.md` with URLs and features. |

**Do not** strip `scripts/`, `.cursor/`, or `.github/workflows/` when copying the template—they are required for automation.

## Phase 3 — Git + GitHub

1. If the folder is not a repo: `git init`, `.gitignore` already ignores `.env`.
2. Create remote repo: `.\scripts\github-create-repo.ps1 -Name <RepoName>` (or user’s org/name).
3. `git remote add origin …`, `git push -u origin main`.
4. Set `GITHUB_REPO_URL` in `.env` **or** rely on `git remote` (see `nanoclaw-deploy.ps1`).

## Phase 4 — Environment (`.env`)

From `.env.example`:

- **Required for deploy:** `NEON_API_KEY`, `RENDER_API_KEY`, `VERCEL_TOKEN`, `JWT_SECRET` (same value on Vercel + Render).
- **Database:** `DATABASE_URL` (or let `neon-create-project.ps1 -UpdateEnv` fill it on first deploy).
- **Render:** `RENDER_BACKEND_SERVICE_ID` after first `render-setup-backend` (script can write it).
- **Optional:** `GITHUB_TOKEN` (GitHub Actions `DATABASE_URL` secret), Google OAuth vars, `FRONTEND_URL` (exact production URL for OAuth callback chain).

## Phase 5 — Deploy (single command)

From **repository root** (PowerShell):

```powershell
.\scripts\load-env.ps1
.\scripts\nanoclaw-deploy.ps1 -AppName <appname>
```

- Creates/uses Neon DB, runs **all** SQL migrations, sets up Render `<appname>-api`, sets Vercel env via **API**, deploys frontend.
- **`-AppName`** drives Vercel project name and default GitHub repo name when remote is missing (see script).
- If **Vercel** asks to install the GitHub app: open the URL the script prints, select the repo, **re-run** deploy.
- If **Render** says repo not connected: connect GitHub in Render Dashboard once, then re-run or run `render-setup-backend.ps1`.

## Phase 6 — Report to the user

Always include:

1. **Frontend** — URL from script output; if the project is under a **Vercel team**, the real URL may be `app-team.vercel.app`, not `app.vercel.app`.
2. **Backend** — `https://…onrender.com` (or script output).
3. **DB** — Neon; `DATABASE_URL` in `.env` only.
4. **Google OAuth** (if used): Authorized redirect URI `https://<backend>/api/auth/google/callback`; then `.\scripts\oauth-setup-render.ps1` after client ID/secret in `.env`.

## Phase 7 — After first deploy

- **Migrations failed in script:** Run `node db/run-all-migrations.js` with valid `DATABASE_URL`; fix SQL; redeploy backend (`.\scripts\render-deploy.ps1`).
- **“Server not configured” on frontend:** Run `.\scripts\vercel-env-set-api.ps1 -ProjectName <appname>` and trigger a new deployment.
- **Logs:** `.\scripts\vercel-logs.ps1`, Render Dashboard for API logs.

## Related skills (read when needed)

| Skill | When |
|-------|------|
| **workflow-deploy-vercel-git** | Wrong site, old code, Git not linked, team URL vs short domain |
| **mvp-paas-auth-oauth** | JWT, bcrypt limits, Google OAuth, `FRONTEND_URL` |
| **monitor-logs-and-fix** | 500s, redirect errors, post-deploy debugging |

## Domain examples (how deep to go)

- **Library (this repo):** `LIBRARY_REQUIREMENTS.md` — ILS-style catalog + circulation + seed data pattern.
- **Next topic:** Same stack—replace entities, migrations, routers, and pages; keep auth and deploy flow.

## Scripts cheat sheet

| Script | Purpose |
|--------|---------|
| `nanoclaw-deploy.ps1 -AppName x` | Full stack deploy |
| `render-setup-backend.ps1 -ServiceName x-api -RepoUrl …` | Create/update Render service |
| `vercel-env-set-api.ps1 -ProjectName x` | Fix `API_BACKEND_URL` / `JWT_SECRET` on team projects |
| `vercel-redeploy-from-git.ps1` | Production deploy from linked Git |
| `oauth-setup-render.ps1` | Push OAuth + `FRONTEND_URL` to Render + deploy |
| `github-create-repo.ps1 -Name x` | New GitHub repo via API |
| `node db/run-all-migrations.js` | Apply all `db/migrations/*.sql` |

---

**Summary for the agent:** On “create an app and deploy,” implement the **topic** in code + migrations, ensure **git + .env**, run **`nanoclaw-deploy.ps1 -AppName <slug>`**, then report URLs and OAuth step. Use sibling skills for Vercel Git issues, OAuth, and logs.
