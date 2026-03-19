# Vercel environment variables (for sign-in and full features)

For **https://library.vercel.app** (or your frontend URL) to have **Sign in**, **Sign up**, and **borrow/return** working:

1. **API_BACKEND_URL** – Your Render backend URL (e.g. `https://library-api.onrender.com`). Without this, the frontend cannot log in or call the API (login/register will return 503).
2. **JWT_SECRET** – Same value as on the Render backend (min 32 chars). Used to verify the session cookie.

Set them in Vercel: Project → Settings → Environment Variables. Then redeploy.

If you use **direct DB** (no Render backend), set **DATABASE_URL** on Vercel instead so the Next.js API routes can talk to Neon. You still need **JWT_SECRET** if you use the backend for auth.
