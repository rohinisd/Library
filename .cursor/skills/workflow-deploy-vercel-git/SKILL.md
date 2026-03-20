---
name: workflow-deploy-vercel-git
description: Full deploy workflow so the live app shows this repo's code—Vercel Git connection, then deploy. Use when the user says features or Sign in/Sign up are missing on the live site, or when adding a rule/skill for "deploy and ensure changes reflect."
---

# Workflow: Deploy and ensure live app reflects this repo

## Goal

After any code or feature change, the **live app** (e.g. https://library.vercel.app) must show **this repo’s** code. If the user sees only a generic home page with no Sign in/Sign up or features, the Vercel project is usually linked to a **different repo** or not linked to Git.

## Steps (in order)

### 1. Check which Vercel project and repo are in use

From **repo root**:

```powershell
.\scripts\load-env.ps1
.\scripts\vercel-list-projects.ps1
.\scripts\vercel-project-info.ps1 -ProjectName library
```

- Use the project name that owns the frontend URL (e.g. `library`). If `library` is not found, try names from the list (e.g. `habit`, `sfms`) or ask the user which Vercel project has their frontend URL.
- If **"No Git repo connected"** or the linked repo is **not** this codebase → the live site will not show this repo’s features until the correct repo is connected (step 2).

### 2. Connect the correct repo in Vercel (user action)

The agent cannot open the Vercel Dashboard. Have the user do this **once**:

1. Open **https://vercel.com/dashboard**
2. Open the project that serves the frontend URL (e.g. the one that gives https://library.vercel.app or the name from step 1)
3. Go to **Settings → Git**
4. **Connect Git Repository** (or **Change**) and select the repo where **this** code lives (e.g. `paas-full-template` or the real repo name)
5. Set **Root Directory** to **`frontend`** if the app is in a monorepo
6. Save

After this, new deployments (from Git push or from CLI) will use this repo’s code.

### 3. Redeploy so the latest code is live

From **repo root**:

```powershell
.\scripts\nanoclaw-deploy.ps1 -AppName library
```

Use the same project name as in step 1 (or set `NANOCLAW_APP_NAME` in `.env`). When the script finishes, share the **Frontend URL** and ask the user to **hard-refresh** (Ctrl+Shift+R) or open the site in an incognito window.

### 4. If the live site still doesn’t update

- Confirm in Vercel **Deployments** that the latest deploy is from the **correct** repo and branch.
- If the project has **Production Branch** set (e.g. `main`), push this repo’s `main` to trigger a Git deploy, or trigger **Redeploy** on the latest deployment.

## New app from scratch (connect repo via API, like Habit)

When the codebase is **not** yet a Git repo or uses a **new** repo (e.g. Library), do the following so Vercel links the project via API (no manual Dashboard Git step):

1. **Create GitHub repo** (if needed):  
   `.\scripts\github-create-repo.ps1 -Name Library`
2. **Init git and push**:  
   `git init`, `git add .`, `git commit -m "..."`, `git remote add origin https://github.com/rohinisd/Library.git`, `git push -u origin main`
3. **Run full deploy**:  
   `.\scripts\nanoclaw-deploy.ps1 -AppName library`  
   - The script calls `vercel-create-project.ps1` with `RepoOwner`/`RepoName` from git remote (or defaults).  
   - If Vercel returns "install the GitHub integration", the script **opens the Vercel GitHub App install page** and continues with a **local deploy** (so the app goes live from local code).
4. **One-time: add the new repo to Vercel**  
   In the opened page, select the **Library** (or your app) repo and complete the install.  
   Then run **deploy again**: `.\scripts\nanoclaw-deploy.ps1 -AppName library`  
   This time `vercel-create-project` will succeed and the project will be **linked to the repo** for Git-based production deploys.

Same pattern as Habit: repo existed and had Vercel app installed, so one run of deploy linked the project. For a new repo, one extra step (install app for that repo, re-run deploy).

## Summary

1. Run `vercel-list-projects.ps1` and `vercel-project-info.ps1 -ProjectName <app>` to see linked repo.
2. **Wrong/missing link:** User: Vercel Dashboard → project → Settings → Git → connect this repo, Root Directory `frontend` if monorepo. **Or** for a new repo: install Vercel app for that repo (script opens the page), then re-run deploy.
3. Run `.\scripts\nanoclaw-deploy.ps1 -AppName <app>`.
4. Give user the frontend URL and remind them to hard-refresh.

All steps we did so far are part of this workflow: check link → fix in Dashboard or install app for new repo → deploy → verify.

---

## Lessons for next project (fine-tune automation)

These issues were found during Library app automation; apply them when setting up the next project.

### 1. Production URL ≠ `{projectName}.vercel.app` for team projects

- If the Vercel project is under a **team**, production is at a URL like `{project}-{team-slug}.vercel.app` (e.g. `library-rohinidevan1989-4846s-projects.vercel.app`), not `library.vercel.app`.
- **Action:** After deploy, get the real production URL from the API: `GET /v9/projects/{name}` → `targets.production.alias` (or `latestDeployments[0].alias`). Tell the user this URL; if they expect `projectName.vercel.app`, they may be looking at a different project (old template). To use the short domain, add it in Vercel → project → Settings → Domains.

### 2. Vercel env vars: CLI often targets wrong project (team vs personal)

- `vercel env add` from the frontend folder often updates the **personal** project or the wrong scope. The **team** project (where the app actually runs) then has no `API_BACKEND_URL` / `JWT_SECRET` → "Server not configured" on sign-in/sign-up.
- **Action:** Use the **Vercel API** to set env vars: `POST /v10/projects/{idOrName}/env?teamId={teamId}&upsert=true` with body `{ key, value, type: "plain", target: ["production","preview"] }`. Get `teamId` from the project: if `project.accountId` starts with `team_`, use it. Run `.\scripts\vercel-env-set-api.ps1 -ProjectName <app>` so the correct project gets `API_BACKEND_URL` and `JWT_SECRET`. Nanoclaw-deploy should call this script every run.

### 3. New app from folder with no git repo

- If the codebase is a copy (e.g. paas-full-template) with no `.git`, there is no repo to link. Vercel create-with-repo will fail or link the wrong repo.
- **Action:** Create GitHub repo (`github-create-repo.ps1 -Name <AppName>`), then `git init`, `git add .`, `git commit`, `git remote add origin`, `git push -u origin main`. Then run deploy; use repo from `git remote` for `vercel-create-project`.

### 4. Vercel "install the GitHub integration" for new repo

- First time a **new** repo (e.g. Library) is used in `vercel-create-project`, the API returns "install the GitHub integration" / "Install GitHub App".
- **Action:** In `vercel-create-project.ps1`, catch this error, open `https://github.com/apps/vercel/installations/new`, print message, `exit 0` (do not throw). Nanoclaw continues with local deploy so the app still goes live. User adds the repo in the opened page, then re-runs deploy so the project is Git-linked.

### 5. Render: "name already in use" (not only "already exists")

- Creating a Render service that already exists can return "name: (library-api) already in use".
- **Action:** In `render-setup-backend.ps1`, treat both "already exists" and "already in use" as “existing service”; look up service by name, sync env vars, trigger deploy, write `RENDER_BACKEND_SERVICE_ID` to `.env`.

### 6. PowerShell and script robustness

- Use `Write-Warning`, not `Write-Warn` (invalid cmdlet). In regex strings with `[ ]` or `|`, use **single quotes** to avoid PowerShell interpolation. Avoid non-ASCII dashes (e.g. en-dash) in script strings; use ASCII hyphen.

### 7. After setting Vercel env vars, redeploy is required

- New env vars apply only to **new** deployments. After running `vercel-env-set-api.ps1`, trigger a production deploy (e.g. `vercel-redeploy-from-git.ps1` or push to main) and tell the user to wait 1–2 min and hard-refresh.

### 8. Summary checklist for “next project”

- [ ] Repo exists and code is pushed (create repo + git init/push if folder is not a repo).
- [ ] Vercel: create/link project (API or Dashboard); if new repo, user installs GitHub app for that repo once.
- [ ] Set **API_BACKEND_URL** and **JWT_SECRET** on the **correct** Vercel project via API (`vercel-env-set-api.ps1`), then redeploy.
- [ ] Confirm production URL (team projects: use URL from API, not `{name}.vercel.app`).
- [ ] Render: handle "already in use"; sync env (e.g. FRONTEND_URL) and trigger deploy.
- [ ] Document for user: real frontend URL, Google OAuth redirect URI, and “add domain in Vercel if you want projectName.vercel.app”.

### 9. Auth (JWT + email/password) for every MVP

- **Vercel** must have `API_BACKEND_URL` (Render FastAPI) and `JWT_SECRET` (same as Render) or login/register break with “Server not configured” or JWT errors.
- **bcrypt** enforces **72 UTF-8 bytes** max; backend uses `auth_bcrypt.py` (direct `bcrypt` package). Do not reintroduce passlib for password hashing without truncating.
- After auth code changes: redeploy **both** Render and Vercel (`nanoclaw-deploy.ps1`).

### 10. Google OAuth for every MVP

- **Human step:** Google Cloud Console — create Web OAuth client; **Authorized redirect URIs** = `https://<BACKEND_URL>/api/auth/google/callback` (backend, not frontend).
- **Authorized JavaScript origins** = `FRONTEND_URL` (exact production URL, often the long `*.vercel.app` team URL).
- **`.env`:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` — then `.\scripts\oauth-setup-render.ps1` (pushes to Render, migrates, **triggers deploy**).
- UI: `/login` and `/register` show Google when `API_BACKEND_URL` is set; flow is `GET /api/auth/google` → backend → Google → backend callback → `FRONTEND_URL/api/auth/oauth-callback?token=...`.
- Full reusable checklist: **skill `mvp-paas-auth-oauth`** (`.cursor/skills/mvp-paas-auth-oauth/SKILL.md`).
