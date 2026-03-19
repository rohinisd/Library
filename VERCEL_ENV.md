# Vercel environment variables (for sign-in and full features)

For the Library frontend to have **Sign in**, **Sign up**, and **borrow/return** working:

1. **API_BACKEND_URL** – Your Render backend URL (e.g. `https://library-api-n9do.onrender.com`). Without this, the frontend cannot log in or call the API (login/register will return 503 "Server not configured").
2. **JWT_SECRET** – Same value as on the Render backend (min 32 chars). Used to verify the session cookie.

**Recommended:** From repo root run `.\scripts\vercel-env-set-api.ps1 -ProjectName library` to set these on the correct Vercel project via API (works for team projects; CLI `vercel env add` often targets the wrong project). Then trigger a redeploy so the new vars take effect.

Or set them manually: Vercel → Project → Settings → Environment Variables (Production + Preview). Then redeploy.

If you use **direct DB** (no Render backend), set **DATABASE_URL** on Vercel instead so the Next.js API routes can talk to Neon. You still need **JWT_SECRET** if you use the backend for auth.
