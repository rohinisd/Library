# Auto-deploy: one push deploys everything

This pattern works for **any app** using this stack. See [INFRASTRUCTURE.md](INFRASTRUCTURE.md) for the reusable model (PaaS, not IaaS).

## Nanoclaw: one-shot deploy (no manual steps)

Say **"deploy the app"** or **"give me final access URLs"** and the agent runs `.\scripts\nanoclaw-deploy.ps1`, then returns the frontend and backend URLs. You need in `.env` once: `NEON_API_KEY`, `RENDER_API_KEY`, `VERCEL_TOKEN`. **Render:** If your GitHub (e.g. rohinisd) is already connected to Render, the script creates the backend service via API—no need to open the dashboard or select the repo. One-time only: if you’ve never connected GitHub to Render, do it once (New → Web Service → connect GitHub); after that, everything is automated. Optional: `GITHUB_TOKEN` + `gh` CLI to set the GitHub Actions secret automatically.

After the [one-time setup in DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md), every **push to `main`** updates the whole stack:

```
You push to main
       │
       ├──► GitHub (source of truth)
       │
       ├──► Vercel    → builds & deploys frontend (e.g. root: frontend)
       ├──► Render    → builds & deploys backend  (your API service, e.g. root: backend)
       └──► Neon      → GitHub Action runs db/migrations/*.sql (uses DATABASE_URL secret)
```

## What you need once (per app)

1. **Vercel** – Repo connected; Root Directory set (e.g. `frontend`). Deploys on push.
2. **Render** – Repo connected; backend service created (run `.\scripts\render-setup-backend.ps1` after connecting, or use `-ServiceName` / `-RepoUrl` for another app). Deploys on push to `main`.
3. **GitHub Actions** – Add secret **DATABASE_URL** (Neon connection string) in repo **Settings → Secrets and variables → Actions**. The workflow runs migrations on every push to `main`.

## Local migrations

To run all migrations locally (e.g. before pushing):

```bash
npm run db:migrate-all
```

Requires `DATABASE_URL` in root `.env`.
