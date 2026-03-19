# PaaS full-stack template

Copy this **entire folder** to start a new app (e.g. library management). It has everything needed to deploy and get URLs + OAuth redirect URI.

## What’s included

| Folder / file | Purpose |
|---------------|--------|
| **frontend/** | Next.js app (no node_modules, .next – run `npm install` in frontend) |
| **backend/** | FastAPI app (Docker, no __pycache__) |
| **db/** | Migrations and run-all-migrations.js |
| **scripts/** | render-setup-backend.ps1, nanoclaw-deploy.ps1, oauth-setup-render.ps1, etc. |
| **.cursor/** | Rules so the agent runs deploy and reports URLs + OAuth redirect URI |
| **.github/workflows/** | deploy.yml – runs DB migrations on push to main |
| **.env.example** | Copy to `.env` and fill in tokens (no secrets in this template) |
| **INFRASTRUCTURE.md, OAUTH_SETUP.md, DEPLOY_CHECKLIST.md, AUTO_DEPLOY.md** | Docs for PaaS and OAuth |

## How to use

1. **Copy** this folder to your new project location (e.g. `MyLibraryApp`).
2. **Copy** `.env.example` to `.env` and add your tokens: `NEON_API_KEY`, `RENDER_API_KEY`, `VERCEL_TOKEN`, `DATABASE_URL`, `JWT_SECRET`. Optional: `GITHUB_TOKEN`, OAuth vars (see OAUTH_SETUP.md).
3. **One-time:** Connect your GitHub repo in [Render](https://dashboard.render.com) (New → Web Service → connect GitHub).
4. **Rename/adapt** the app (e.g. change branding, entities for “library management”).
5. Say **“deploy the app”** or **“give me final access URLs”** – the agent runs the deploy script and returns Frontend URL, Backend URL, and the **Google OAuth redirect URI** to add in Google Console.
6. For OAuth: create an OAuth client in Google Cloud, add the redirect URI the script printed, and ensure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` are in `.env` (then run `.\scripts\oauth-setup-render.ps1` or they’re set by render-setup-backend).

## First-time in the new folder

- In **frontend:** run `npm install`.
- In **backend:** run `pip install -r requirements.txt` if you run it locally.
- Root: `npm run db:migrate-all` (needs `DATABASE_URL` in `.env`).
