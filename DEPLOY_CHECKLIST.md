# Deploy checklist (all steps)

This setup is **reusable for any app**: same stack (Vercel + Render + Neon + GitHub Actions). See [INFRASTRUCTURE.md](INFRASTRUCTURE.md) for the model and how to use it for a different project.

**Nanoclaw:** Say **"deploy the app"** or **"give me final access URLs"** and the agent runs `.\scripts\nanoclaw-deploy.ps1` and returns the frontend and backend URLs (one-shot; see [AUTO_DEPLOY.md](AUTO_DEPLOY.md)).

## Auto-deploy on every push to `main`

Once the one-time setup below is done, **every push to `main`** automatically:

| Where   | What happens |
|--------|----------------|
| **GitHub** | Code is the source of truth. |
| **Vercel** | Frontend auto-deploys (Vercel is connected to your repo). |
| **Render** | Backend API auto-deploys (Render watches the same repo/branch). |
| **Neon**   | GitHub Action runs DB migrations (`db/migrations/*.sql`) using `DATABASE_URL` secret. |

**One-time for migrations:** In GitHub → your repo → **Settings** → **Secrets and variables** → **Actions** → add secret **DATABASE_URL** with your Neon connection string (same as in `.env`). Then the workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs migrations on each push.

---

## Done automatically (by scripts/config)

- **JWT_SECRET** added to root `.env` and to **Vercel** (production). Same value must be used on Render for the backend.
- **Script** `scripts/render-setup-backend.ps1`: creates (or finds) the backend service on Render, sets all env vars (DATABASE_URL, JWT_SECRET, GOOGLE_*, FRONTEND_URL), triggers deploy, prints backend URL (run after connecting repo once). For another app use: `-ServiceName myapp-api -RepoUrl https://github.com/you/MyApp`.

## You do once

### 1. Render – connect GitHub once, then one script does everything

1. **One-time:** Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service** → connect **GitHub** if not already (e.g. rohinisd). You don’t create the service in the UI.
2. **Automated:** From repo root run **`.\scripts\render-setup-backend.ps1`**. It will **create** the backend service (habit-api) if missing, or **find** it and sync env vars if it exists; set **DATABASE_URL**, **JWT_SECRET**, **GOOGLE_CLIENT_ID**, **GOOGLE_CLIENT_SECRET**, **FRONTEND_URL** on Render; trigger deploy; print the backend URL and Google redirect URI. For another app: `-ServiceName myapp-api -RepoUrl https://github.com/you/MyApp`.
3. Use the printed backend URL for Vercel’s **API_BACKEND_URL** and for Google OAuth redirect URI (`https://that-url/api/auth/google/callback`).

### 2. Vercel – point frontend at backend

1. Vercel → your project → **Settings** → **Environment Variables**.
2. Add **API_BACKEND_URL** = your Render backend URL (e.g. `https://habit-api-xxxx.onrender.com`), no trailing slash.  
   Ensure **JWT_SECRET** matches the one used by the backend.
3. Redeploy the frontend (Deployments → … → Redeploy) so the new env is used.

### 2b. Google OAuth (Gmail login, optional)

One-time: follow **[OAUTH_SETUP.md](OAUTH_SETUP.md)** (Google Cloud OAuth client, redirect URIs, backend env `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, then run migration `002_oauth.sql`). After that, "Sign in with Google" appears on the login page when the app uses the external backend.

### 3. Local backend (optional)

From repo root:

```powershell
cd backend
pip install -r requirements.txt
# .env is loaded from repo root if you run:
..\scripts\load-env.ps1  # in PowerShell from backend, or set DATABASE_URL and JWT_SECRET
python -m uvicorn main:app --reload --port 10000
```

Or run `.\backend\run-local.ps1` from repo root (loads `.env` and starts uvicorn).

Open **http://localhost:10000/docs** for API docs.

---

**Summary:** Connect your repo on Render → run `.\scripts\render-setup-backend.ps1` (or create the service manually) → add **API_BACKEND_URL** on Vercel → add **DATABASE_URL** in GitHub Actions secrets → redeploy. After that, every push to `main` deploys frontend (Vercel), backend (Render), and runs DB migrations (Neon via GitHub Actions). Local backend: `cd backend`, `pip install -r requirements.txt`, then `run-local.ps1` or uvicorn as above.
