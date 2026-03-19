# Library app – correct Vercel URL

The **Library** project (with Sign in, Sign up, books, dashboard) is under your **team**, so production is not at `library.vercel.app`.

## Use this URL (has Sign in / Sign up)

**https://library-rohinidevan1989-4846s-projects.vercel.app**

Open this in incognito or hard-refresh (Ctrl+Shift+R). You should see the correct landing page with **Sign in**, **Sign up**, and **Browse**.

## Why `library.vercel.app` shows old code

`library.vercel.app` is very likely a **different** Vercel project (e.g. personal account or an older “library” project). The project we deploy to (linked to `rohinisd/Library` with root `frontend`) uses the team URL above.

## Use `library.vercel.app` for this app

1. Open **https://vercel.com** and switch to the team **rohinidevan1989-4846s-projects** (or the team that owns the Library project).
2. Open the **library** project.
3. Go to **Settings → Domains**.
4. Add **library.vercel.app**.
5. If it’s already used by another project, remove it from that project first (that project’s Settings → Domains), then add it to this **library** project.

After that, **library.vercel.app** will serve the same app (with Sign in / Sign up) as the URL above.
