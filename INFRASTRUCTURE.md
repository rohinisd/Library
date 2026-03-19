# Infrastructure: reusable for any app (PaaS, not IaaS)

This repo is set up so you can use the **same stack** for any project, not just one app.

## IaaS vs what you have here

- **IaaS (Infrastructure as a Service)** = you get raw building blocks: VMs, networks, disks. You install OS, runtimes, and your app (e.g. AWS EC2, Azure VMs, GCP Compute Engine). Full control, more ops work.

- **What this setup is** = **PaaS-style (Platform as a Service)**. You push code; the platform builds, runs, and scales it. You don’t manage servers or OS. Good default for most web apps.

| Layer     | This stack | Typical IaaS alternative |
|----------|------------|----------------------------|
| Frontend  | **Vercel** (build + host) | VM + Node + nginx |
| Backend   | **Render** (Docker)       | VM + Docker / K8s |
| Database  | **Neon** (Postgres)       | VM + Postgres or RDS |
| CI/CD     | **GitHub Actions**        | Same or Jenkins on a VM |

So: you’re getting **hosting + DB + auto-deploy** without managing servers. If you later need real IaaS (custom OS, full control), you’d add something like AWS/GCP/Azure and optionally move parts of the app there.

---

## Reusable “one push deploys everything” model

Same idea for **any** app:

1. **GitHub** – source of truth; you push code.
2. **Vercel** – frontend (or static site); auto-deploys on push.
3. **Render** – backend API (or another service); auto-deploys on push.
4. **Neon** – Postgres; schema via migrations.
5. **GitHub Actions** – on push to `main`, run DB migrations (and any other checks you add).

Project-specific details are **repo URL**, **service names**, **root directories**, and **env vars**. The scripts and workflow are generic; you plug in your app name and repo.

---

## Using this for a new app (e.g. library management)

To get **create + deploy + all URLs + OAuth redirect URI** in one go, you need the **full template**, not just `.cursor` and `.env`:

- **Copy (or clone) the whole repo**: `frontend/`, `backend/`, `db/`, `scripts/`, `.cursor/`, `.github/`, root `package.json`, and a `.env` with your tokens. The agent needs `scripts/` (nanoclaw, render-setup-backend, etc.) to run deploy; it needs the app structure to deploy something.
- **Rename/adapt** the app (e.g. change app name, entities for "library management"). Update `.env` with a new app name or repo if you use a new GitHub repo.
- **One-time:** Connect the **new repo** to Render (and Vercel) if it’s a different repo. If you’re reusing the same repo with a new branch, the existing connection may work.
- Then say **"deploy the app"** (or "give me final access URLs"). The agent runs the deploy script and returns **Frontend URL**, **Backend URL**, and the **Google OAuth redirect URI** to add in Google Console.

If you copy **only** `.cursor` and `.env` into an empty folder, there is no app and no `scripts/` to run—the agent can’t deploy. Use the full repo as a template.

Keep the layout that fits you, e.g.:
   - `frontend/` – frontend app (Vercel builds this)
   - `backend/` – API (Render runs this)
   - `db/migrations/` – SQL migrations (Neon + GitHub Actions run these)

2. **Set your app’s values** (in `.env` and/or script parameters):
   - `GITHUB_REPO_URL` (e.g. `https://github.com/you/MyApp`)
   - Backend service name (e.g. `myapp-api` on Render)
   - Vercel project name and Root Directory (e.g. `frontend`)

3. **Connect GitHub once** (if not already):
   - **Render** – Dashboard → New → Web Service → connect GitHub. After that, the script creates the backend service via API; you don’t select the repo in the UI.
   - **Vercel** – Import your repo, set Root Directory (or let nanoclaw create the project with root `frontend`).

4. **Run the setup script** for the backend (with your app’s name/repo if you use the generic form):
   ```powershell
   .\scripts\render-setup-backend.ps1
   # Or with overrides:
   .\scripts\render-setup-backend.ps1 -ServiceName "myapp-api" -RepoUrl "https://github.com/you/MyApp"
   ```

5. **Secrets**
   - **Vercel:** `API_BACKEND_URL`, `JWT_SECRET`, etc.
   - **GitHub Actions:** `DATABASE_URL` (for migrations).

After that, **every push to `main`** deploys frontend (Vercel), backend (Render), and runs migrations (Neon via the same workflow). Same pattern for any app; only names and URLs change.
