---
name: monitor-logs-and-fix
description: When the user reports an error (e.g. "internal server error", "500", "something broke") or asks to "check logs" or "monitor logs", fetch Vercel and Render logs, look for errors, and fix the code automatically.
---

# Monitor logs and fix issues

## When to use

- User says they are getting **internal server error**, **500**, or any runtime error.
- User asks to **check logs**, **monitor logs**, or **see what's failing**.

## What to do

### 1. Fetch logs

From **repo root** run:

```powershell
.\scripts\load-env.ps1
.\scripts\vercel-logs.ps1 -ProjectName library
.\scripts\render-logs.ps1
```

(Use the actual project name if different, e.g. from `NANOCLAW_APP_NAME` or `.env`.)

- **Vercel:** Frontend (Next.js) errors – API routes, server components, build/runtime.
- **Render:** Backend (FastAPI) errors – auth, DB, unhandled exceptions.

If `vercel-logs.ps1` hangs, cancel and tell the user to open **Vercel Dashboard → project → Deployments → latest → Logs**. If Render API fails, the script already prints the Dashboard link; user can open **Render Dashboard → service → Logs**.

### 2. Interpret and fix

- **Frontend 500 / Internal Server Error**
  - Often: uncaught exception in API route or server component (e.g. missing env, `getPool()` throw, JWT verify throw, fetch to backend failed).
  - **Fix:** Add try/catch in API routes; return 503 or 500 with a safe message instead of throwing. Ensure `getSession()` and auth never throw (catch and return null). Add `error.tsx` and `global-error.tsx` so React errors show a friendly page instead of a raw 500.
- **"Server not configured" / 503**
  - Frontend has no `API_BACKEND_URL` (and no `DATABASE_URL` in direct-DB mode). **Fix:** Run `.\scripts\vercel-env-set-api.ps1 -ProjectName <app>` and redeploy so the correct Vercel project gets env vars.
- **Backend 500 (Render)**
  - Often: missing `DATABASE_URL` or `JWT_SECRET` on Render, DB connection failure, or unhandled exception in FastAPI. **Fix:** Ensure Render service has env vars (same script that syncs from `.env`); add try/except in backend routes and return 500 with a safe body; check backend logs in Render Dashboard.
- **Build errors in Vercel logs**
  - Fix the reported TypeScript/import/runtime error in the repo and push; next deploy will pick it up.

### 3. After fixing

- If you changed code: commit, push, and trigger a redeploy (e.g. `.\scripts\nanoclaw-deploy.ps1 -AppName library` or `.\scripts\vercel-redeploy-from-git.ps1`).
- If you only changed env (e.g. ran `vercel-env-set-api.ps1`): trigger a redeploy so the new vars take effect.
- Tell the user to wait 1–2 minutes and hard-refresh (Ctrl+Shift+R) or try in incognito.

## Summary

1. Run `vercel-logs.ps1` and `render-logs.ps1` when the user reports an error or asks to check logs.
2. Look for `error`, `500`, `fail`, stack traces, or missing env in the output.
3. Fix the cause in code (try/catch, env, error boundaries) or by setting env vars and redeploying.
4. Redeploy after changes and ask the user to verify.

**Note:** The agent cannot "monitor logs all the time" in the background. This skill runs when the user reports an issue or asks to check logs; then the agent fetches logs, diagnoses, and fixes.
