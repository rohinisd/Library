# Deploy workflow – so the live app shows this repo’s code

If the live site (e.g. https://library.vercel.app) shows only a basic home page **without Sign in, Sign up, or other features**, the Vercel project is likely linked to a **different repo**. Do the following.

## 1. Check which repo is linked (run from repo root)

```powershell
.\scripts\vercel-list-projects.ps1
.\scripts\vercel-project-info.ps1 -ProjectName library
```

If you see **"Project 'library' not found"**, the project may be under a team or have another name. Check **https://vercel.com/dashboard** and find the project that has your frontend URL.

## 2. Connect this repo in Vercel (one-time)

1. Open **https://vercel.com/dashboard**
2. Open the project that serves your frontend URL (e.g. **library** or the name from the list)
3. Go to **Settings → Git**
4. Click **Connect Git Repository** (or **Change**)
5. Select the repo where **this** code lives (e.g. `paas-full-template` or your fork)
6. Set **Root Directory** to **`frontend`** (this app is in the `frontend` folder)
7. Save

## 3. Redeploy

```powershell
.\scripts\nanoclaw-deploy.ps1 -AppName library
```

Then open the frontend URL and do a **hard refresh** (Ctrl+Shift+R) or use an incognito window.

## 4. Optional: use a different project name

If your Vercel project has another name (e.g. `habit`), run:

```powershell
.\scripts\nanoclaw-deploy.ps1 -AppName habit
```

Or set in `.env`: `NANOCLAW_APP_NAME=habit`

---

**Summary:** List/check project → In Vercel connect **this** repo and set Root Directory to `frontend` → Run nanoclaw-deploy → Hard-refresh the site.
