# One-time setup: Google OAuth (Gmail login)

The app shows **Sign in with Google** on `/login` and **Continue with Google** on `/register` when the frontend has **`API_BACKEND_URL`** set (external backend). Same OAuth callback creates or links the user.

This is a **one-time setup** per app. After you complete it, "Sign in with Google" works on your frontend and backend.

**Can this be fully automated?** Google does **not** provide a public CLI or API to create the OAuth client. You do **Part A** and **Part B** once. Then run **`.\scripts\oauth-setup-render.ps1`** to push the values to Render and run the DB migration.

---

## Part A: Create OAuth client in Google Cloud (in browser)

Do this once. Have your **backend URL** and **frontend URL** ready (e.g. from Render and Vercel).

### Step 1: Open Google Cloud Console

1. Go to **https://console.cloud.google.com/** in your browser.
2. Sign in with the Google account you want to use for the project.

### Step 2: Create or select a project

1. At the top of the page, click the **project dropdown** (it may say "Select a project" or show the current project name).
2. Click **"New Project"**.
3. **Project name:** e.g. `Habit` or your app name.
4. Click **"Create"**. Wait a few seconds, then select this project from the dropdown if it didn’t switch automatically.

### Step 3: Configure the OAuth consent screen (if asked later)

1. In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"** (or you’ll be sent here when creating credentials).
2. **User Type:** choose **"External"** (so any Google user can sign in). Click **"Create"**.
3. **App information:**
   - **App name:** e.g. `Habit`
   - **User support email:** choose your email from the dropdown
   - **Developer contact:** your email
4. Click **"Save and Continue"**.
5. On **Scopes:** click **"Save and Continue"** (no need to add scopes; we’ll request `openid email profile` in code).
6. On **Test users:** click **"Save and Continue"** (for External in testing mode you can add test users later if needed).
7. Click **"Back to Dashboard"**.

### Step 4: Create OAuth client ID (Web application)

1. In the left sidebar: **"APIs & Services"** → **"Credentials"**.
2. Click **"+ Create Credentials"** at the top → **"OAuth client ID"**.
3. If you see “Configure consent screen”, complete **Step 3** above first, then come back to Credentials and click **"+ Create Credentials"** → **"OAuth client ID"** again.
4. **Application type:** select **"Web application"**.
5. **Name:** e.g. `Habit Web` (any name you like).
6. **Authorized JavaScript origins** – click **"+ Add URI"** and add **one per line**:
   - Your production frontend, e.g. `https://habit.vercel.app` (use your real Vercel URL, no trailing slash).
   - For local dev: `http://localhost:3000`
7. **Authorized redirect URIs** – click **"+ Add URI"** and add:
   - Your **backend** callback URL: `https://YOUR-BACKEND-URL/api/auth/google/callback`  
     Replace `YOUR-BACKEND-URL` with your real Render URL, e.g. `https://habit-api-xxxx.onrender.com` (no trailing slash).  
     Full example: `https://habit-api-xxxx.onrender.com/api/auth/google/callback`
   - For local backend: `http://localhost:10000/api/auth/google/callback`  
     (Port **10000** is the backend; port 3000 is the frontend. Google sends the auth code to the **backend** callback.)
8. Click **"Create"**.
9. A popup shows **"OAuth client created"** with:
   - **Your Client ID** (long string ending in `.apps.googleusercontent.com`)
   - **Your Client Secret** (click "Copy" or write it down; you can’t see it again easily later)
10. **Copy your Client ID** from the modal.  
    **Get your Client Secret:** Click **"Download JSON"** in the modal. Open the downloaded file; inside you’ll see `"client_secret": "GOCSPX-..."` — that value is your **GOOGLE_CLIENT_SECRET**. (Google often shows the secret only once; if you didn’t copy it, use the JSON file or create a new OAuth client.)  
    Keep both values for **Part B**.

---

## Part B: Add Client ID, Secret, and FRONTEND_URL to `.env`

Do this once, in your project folder.

### Step 1: Open your `.env` file

1. In your Habit project, open the **`.env`** file in the **root** of the repo (same folder as `package.json`, `frontend/`, `backend/`).  
   If `.env` doesn’t exist, create a new file named exactly `.env` in that root folder.

### Step 2: Add these three lines

Paste the following, then **replace the placeholders** with your real values:

```env
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**What to use:**

| Variable | Where to get it |
|----------|------------------|
| `GOOGLE_CLIENT_ID` | From the Google Cloud popup (Part A, Step 4.9). The long string ending in `.apps.googleusercontent.com`. |
| `GOOGLE_CLIENT_SECRET` | Click **"Download JSON"** in the "OAuth client created" popup. Open the file and use the value of `"client_secret"` (starts with `GOCSPX-`). Or copy it from the popup if it’s shown there. |
| `FRONTEND_URL` | Your live frontend URL, **no trailing slash**. Example: `https://habit-five-rho.vercel.app` or whatever your Vercel URL is. |

**Example** (fake values):

```env
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
FRONTEND_URL=https://habit-five-rho.vercel.app
```

- Don’t put quotes around the values.
- Don’t add spaces around the `=` sign.
- Save the file.

### Step 3: Run the script (pushes to Render + runs migration)

From the **repo root** in PowerShell (or terminal):

```powershell
.\scripts\oauth-setup-render.ps1
```

This reads `.env`, pushes `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `FRONTEND_URL` to your Render backend, and runs the DB migration. You don’t need to add these in the Render dashboard.

---

## Quick reference (after Part A and B)

- **Backend URL** = your Render service URL (e.g. `https://habit-api-xxxx.onrender.com`).
- **Frontend URL** = your Vercel app URL (e.g. `https://habit-five-rho.vercel.app`).
- **Redirect URI** in Google = `https://YOUR-BACKEND-URL/api/auth/google/callback` (must be the **backend** URL). To get your backend URL: run **`.\scripts\render-setup-backend.ps1`** (or **`.\scripts\render-get-service-url.ps1`**); the script prints the URL and the exact redirect URI to add in Google Console.  
- **Why port 10000 for local?** The frontend runs on port **3000**, the backend on **10000**. The redirect URI is the **backend** callback, so local = `http://localhost:10000/api/auth/google/callback`.

---

## Optional: Frontend env

No extra env is required on the frontend. "Sign in with Google" appears when `API_BACKEND_URL` is set. The flow uses the backend for the redirect and token.

---

## Summary checklist

- [ ] **Part A:** Google Cloud – OAuth client (Web application) created; Client ID and Secret copied; Authorized JavaScript origins and **redirect URI** (`https://YOUR-BACKEND-URL/api/auth/google/callback`) set.
- [ ] **Part B:** `.env` – `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` added (no quotes, no spaces around `=`).
- [ ] Run `.\scripts\oauth-setup-render.ps1` from repo root → sets env on Render and runs DB migration.

After this, "Sign in with Google" on the login page completes the OAuth flow and issues a JWT. The backend redirects to `FRONTEND_URL/api/auth/oauth-callback?token=...`; the frontend sets the cookie and sends the user to the dashboard.
