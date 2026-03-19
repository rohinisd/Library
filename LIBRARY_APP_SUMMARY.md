# Library app – summary and URLs

## What was built

- **Backend (FastAPI):** Auth (register, login, logout, Google OAuth), Books (list, get, create, update), Loans (my loans, checkout, return).
- **Frontend (Next.js):** Login, Register, Dashboard (catalog + my loans), Add Book, My Loans with return.
- **DB (Neon):** Migrations `001_init.sql` (users, books, loans), `002_oauth.sql` (Google OAuth columns).

## After deploy succeeds (once .env has valid tokens)

When you run `.\scripts\nanoclaw-deploy.ps1 -AppName library` with valid **NEON_API_KEY**, **RENDER_API_KEY**, and **VERCEL_TOKEN** in `.env`, the script will print:

| What | URL |
|------|-----|
| **Frontend** | `https://library.vercel.app` (or the URL from the deploy output) |
| **Backend** | `https://library-api.onrender.com` (or your Render service URL) |
| **Database** | Neon – connection string in `.env` as `DATABASE_URL` |

## Google OAuth (add in Google Cloud Console)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create or edit an OAuth 2.0 Client ID (Web application).
3. **Authorized JavaScript origins:** add your frontend URL (e.g. `https://library.vercel.app`).
4. **Authorized redirect URIs:** add exactly:
   ```text
   https://<YOUR-BACKEND-URL>/api/auth/google/callback
   ```
   Replace `<YOUR-BACKEND-URL>` with the backend URL from the deploy output (e.g. `https://library-api.onrender.com` – no trailing slash).

5. In `.env` set:
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
   - `FRONTEND_URL=https://your-frontend-url.vercel.app`
6. Run `.\scripts\oauth-setup-render.ps1` to push OAuth env vars to Render (or set them in the Render dashboard).

## Quick test without deploy

- **Local backend:** `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 10000` (set `DATABASE_URL` in `.env` at repo root).
- **Local frontend:** `cd frontend && npm install && npm run dev` (set `API_BACKEND_URL=http://localhost:10000` and `DATABASE_URL` if not using backend for DB).
- **Migrations:** From repo root: `node db/run-all-migrations.js` (requires `DATABASE_URL` in `.env`).
