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

## Summary

1. Run `vercel-list-projects.ps1` and `vercel-project-info.ps1 -ProjectName <app>` to see linked repo.
2. User: Vercel Dashboard → project → Settings → Git → connect this repo, Root Directory `frontend` if monorepo.
3. Run `.\scripts\nanoclaw-deploy.ps1 -AppName <app>`.
4. Give user the frontend URL and remind them to hard-refresh.

All steps we did so far are part of this workflow: check link → fix in Dashboard if wrong → deploy → verify.
