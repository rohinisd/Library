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
