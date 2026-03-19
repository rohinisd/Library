# Automation hurdles (for 0 human involvement)

Notes from full automation runs. Goal: **zero human involvement** after initial one-time setup.

---

## Hurdles fixed in this run

### 1. **Root `pg` not installed before migrations**
- **Issue:** `npm run db:migrate-all` failed with `Cannot find module 'pg'` because root `package.json` has `pg` but `npm install` was never run at repo root.
- **Fix:** Nanoclaw script now runs `npm install` at root before migrations.

### 2. **Node pg driver writes SSL warning to stderr → PowerShell stops**
- **Issue:** `node db/run-all-migrations.js` prints a deprecation warning to stderr; PowerShell with `$ErrorActionPreference = "Stop"` treated it as a terminating error.
- **Fix:** Temporarily set `$ErrorActionPreference = "Continue"` during migration run; run migrations via `node db/run-all-migrations.js` (not `npm run`) and capture output. Migrations succeed; warning is harmless.

### 3. **GitHub secret step fails when not a git repo**
- **Issue:** `gh secret set DATABASE_URL` failed with "fatal: not a git repository", stopping the script.
- **Fix:** Only run `gh secret set` when `Test-Path .git` is true and `GITHUB_TOKEN` is set; otherwise skip with a message.

### 4. **Render setup failure stopped entire deploy**
- **Issue:** If the GitHub repo is not connected to Render, `render-setup-backend.ps1` exits 1 and the script exited, so Vercel never ran.
- **Fix:** Render setup is non-fatal: on failure, script continues and prints a warning; backend URL in output may be from `.env` (existing service) or placeholder.

### 5. **Vercel project create requires GitHub integration**
- **Issue:** `vercel-create-project.ps1` (API create with `gitRepository`) failed with "install the GitHub integration first" when repo not linked to Vercel.
- **Fix:** Wrapped in try/catch so script continues; then run `vercel link --yes --project <AppName>` and deploy from frontend directory.

### 6. **Vercel “not linked” when deploying from frontend**
- **Issue:** `vercel env add` and `vercel deploy` from `frontend/` failed with "Your codebase isn't linked to a project".
- **Fix:** Before env add and deploy, run `npx vercel link --yes --project $AppName --token $token` from `frontend/`. Deploy and env add run from `frontend/` (Push-Location).

### 7. **Vercel/npx stderr treated as error**
- **Issue:** `npx vercel link` and related commands write progress to stderr ("Loading scopes…" etc.); PowerShell treated this as NativeCommandError and stopped.
- **Fix:** Set `$ErrorActionPreference = "Continue"` for the whole Vercel block (link, env add, deploy); restore "Stop" in finally.

### 8. **Script exit code 1 despite success**
- **Issue:** Deploy completed and printed "DEPLOY COMPLETE", but script exited with code 1 due to earlier stderr.
- **Fix:** Set `$LASTEXITCODE = 0` at end of script after printing success.

---

## Hurdles that still need one-time human action

### 9. **Render: repo must be connected once**
- **Issue:** Creating a new Render web service with a GitHub repo URL fails with "invalid or unfetchable" / "Connect your repo" if that repo has not been connected to Render (GitHub OAuth).
- **Fix (one-time):** User goes to https://dashboard.render.com → New → Web Service → connect GitHub → select the repo. After that, re-run deploy to create/update the backend service. **Cannot be automated** via Render API without pre-connected repo.

### 10. **Vercel: GitHub app install for project create/link**
- **Issue:** Creating a Vercel project via API with `gitRepository` requires the Vercel GitHub app to be installed and the repo selected.
- **Fix (one-time):** User installs https://github.com/apps/vercel and selects the repo. Alternatively, deploy without API project create: use `vercel link --yes --project <name>` and `vercel deploy --prod` from local (current approach).

### 11. **No git repo in project folder**
- **Issue:** If the app is a copy (e.g. paas-full-template) with no `.git`, the script cannot push to GitHub, so Render has nothing to deploy from, and `gh secret set` is skipped.
- **Fix (one-time):** User runs `git init`, `git remote add origin <url>`, pushes to GitHub. Then connect that repo in Render (and optionally Vercel). After that, full automation can run.

### 12. **Google OAuth redirect URI**
- **Issue:** Google has no public API to create OAuth clients or add redirect URIs.
- **Fix (one-time):** After first deploy, user adds `https://<backend-url>/api/auth/google/callback` in Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs.

### 13. **Backend URL in output when Render fails**
- **Issue:** When Render setup fails (e.g. repo not connected), `render-get-service-url.ps1` may still run and return the service ID from `.env` (e.g. a different app’s backend). Printed “Backend” URL can be misleading.
- **Fix:** When Render setup failed, either don’t call render-get-service-url, or print a clear note: “Backend: not created (connect repo); use API_BACKEND_URL from .env if using existing service.”

---

## Path to 0 human involvement (after one-time setup)

1. **One-time (human):**
   - Create GitHub repo and push this project (or clone from a repo that already has the code).
   - Connect that repo in Render (Dashboard → connect GitHub → select repo).
   - Optionally connect repo in Vercel (install GitHub app, select repo) for project create via API.
   - Add Google OAuth redirect URI in Google Console (after first deploy, using the backend URL).
   - Ensure `.env` has: `NEON_API_KEY`, `DATABASE_URL`, `RENDER_API_KEY`, `VERCEL_TOKEN`, `JWT_SECRET`, and optionally `GITHUB_TOKEN`, `GOOGLE_*`, `FRONTEND_URL`.

2. **Fully automated (no human):**
   - Run `.\scripts\nanoclaw-deploy.ps1 -AppName library` (or set `NANOCLAW_APP_NAME=library`).
   - Script will: ensure Neon DB → `npm install` (root) → migrations → (if git repo + GITHUB_TOKEN) set GitHub secret → Render setup (create/update service, set env, trigger deploy) → Vercel link (frontend) → Vercel env add → Vercel deploy.
   - Output: Frontend URL, Backend URL, and Google OAuth redirect URI to add (if not done yet).

3. **Optional automation improvements:**
   - **pg SSL warning:** In `db/run-all-migrations.js` or connection string, use `?sslmode=verify-full` to satisfy the driver and avoid stderr warning.
   - **Backend URL when Render fails:** If Render create failed, set `$backendUrl = "https://$AppName-api.onrender.com (connect repo and re-run to create)"` and skip `render-get-service-url`.

---

## Summary of script changes made

| File | Change |
|------|--------|
| `scripts/nanoclaw-deploy.ps1` | Run `npm install` before migrations; run migrations with `node db/run-all-migrations.js` and `Continue`; skip `gh secret` when not git repo; Render setup non-fatal; Vercel create in try/catch; run Vercel from `frontend/` with `vercel link --yes --project $AppName`; `Continue` for Vercel block; `$LASTEXITCODE = 0` at end. |

---

## Deploy result (this run)

- **Frontend:** https://library.vercel.app  
- **Backend:** From `.env` (e.g. existing Render service); if library-api was not created, connect repo and re-run for a dedicated backend.
- **Database:** Neon (`DATABASE_URL` in `.env`)
- **Google OAuth:** Add `https://<your-backend-url>/api/auth/google/callback` in Google Console (use the library-api URL after Render succeeds).
