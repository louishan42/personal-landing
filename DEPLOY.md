# LifeVerse — Deploy to Production

Deploy **LifeVerse** with:
- **Frontend** → [Vercel](https://vercel.com) (free)
- **Backend** → [Render](https://render.com) (free)
- **Database** → [Neon](https://neon.tech) PostgreSQL (free) — recommended  
  OR Render PostgreSQL (included in `render.yaml`)

---

## Overview

```
User Browser
    ↓
Vercel (React frontend)  →  Render (Node.js API)  →  Neon PostgreSQL
         ↑                          ↑
    Google OAuth              Google OAuth
```

---

## Step 1 — Push code to GitHub

```bash
cd personal-landing
git add .
git commit -m "LifeVerse ready for deployment"
git push origin main
```

If you don't have a repo yet:
```bash
gh repo create lifeverse --private --source=. --push
```

---

## Step 2 — PostgreSQL on Neon (recommended, free)

Neon is a free cloud PostgreSQL — easier than Atlas for Postgres.

1. Go to **[neon.tech](https://neon.tech)** → Sign up (free)
2. Click **New Project** → name it `lifeverse`
3. Copy the **connection string** (looks like):
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/lifeverse?sslmode=require
   ```
4. Save this — you'll use it as `DATABASE_URL` on Render

> **Alternative:** Skip Neon and use Render's database from `render.yaml` (Step 3).

---

## Step 3 — Deploy backend on Render

1. Go to **[render.com](https://render.com)** → Sign up
2. Click **New +** → **Blueprint** (or Web Service)
3. Connect your GitHub repo
4. Render detects `render.yaml` automatically, OR create manually:

| Setting | Value |
|---------|-------|
| Name | `lifeverse-api` |
| Root Directory | `backend` |
| Build Command | `npm install && npx prisma generate` |
| Start Command | `npx prisma db push && node server.js` |
| Plan | Free |

5. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string (Step 2) |
| `JWT_SECRET` | Random string (run: `openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` | From Step 5 below |
| `ADMIN_EMAIL` | Your Gmail, e.g. `you@gmail.com` |
| `ADMIN_PASSWORD` | Strong admin password |
| `FRONTEND_URL` | `https://YOUR-APP.vercel.app` (add after Step 4) |
| `NODE_ENV` | `production` |

6. Deploy → copy your API URL, e.g. `https://lifeverse-api.onrender.com`

7. Test: open `https://lifeverse-api.onrender.com/api/health`  
   Should show: `{"status":"ok","service":"LifeVerse API",...}`

---

## Step 4 — Deploy frontend on Vercel

1. Go to **[vercel.com](https://vercel.com)** → Sign up
2. **Add New Project** → Import your GitHub repo
3. Settings:

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://lifeverse-api.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Same Client ID as backend (Step 5) |

5. Deploy → copy your URL, e.g. `https://lifeverse.vercel.app`

6. Go back to **Render** → update `FRONTEND_URL` to your Vercel URL → redeploy

---

## Step 5 — Fix Google OAuth (401 invalid_client)

This is why sign-in fails locally and in production.

### Create OAuth credentials

1. **[Google Cloud Console](https://console.cloud.google.com/apis/credentials)**
2. Create a project (or select existing)
3. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `LifeVerse`
   - Add your email as developer
   - Scopes: `email`, `profile`, `openid`
   - Test users: add your Gmail while in testing mode
4. **Credentials → Create Credentials → OAuth client ID**
   - Type: **Web application**
   - Name: `LifeVerse`

5. **Authorized JavaScript origins** — add ALL of these:
   ```
   http://localhost:3000
   https://YOUR-APP.vercel.app
   ```

6. Copy the **Client ID** (ends in `.apps.googleusercontent.com`)

### Add Client ID everywhere

**Local — `backend/.env`:**
```
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

**Local — `frontend/.env`:**
```
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

**Render** → Environment → `GOOGLE_CLIENT_ID` = same value

**Vercel** → Settings → Environment Variables → `VITE_GOOGLE_CLIENT_ID` = same value

Restart local servers after changing `.env` files.

---

## Step 6 — Verify everything works

### Local
```bash
docker compose up -d          # PostgreSQL
cd backend && npm run dev     # port 3001
cd frontend && npm run dev    # port 3000
```

- Login: http://localhost:3000/login (Google)
- Admin: http://localhost:3000/admin/login

### Production
- App: `https://YOUR-APP.vercel.app`
- API health: `https://lifeverse-api.onrender.com/api/health`
- Admin: `https://YOUR-APP.vercel.app/admin/login`

---

## Environment variables checklist

### Backend (Render)
- [ ] `DATABASE_URL` — Neon or Render PostgreSQL
- [ ] `JWT_SECRET` — random 64-char hex
- [ ] `GOOGLE_CLIENT_ID` — real Client ID (not REPLACE_ME)
- [ ] `ADMIN_EMAIL` — your Gmail
- [ ] `ADMIN_PASSWORD` — secure password
- [ ] `FRONTEND_URL` — Vercel URL (no trailing slash)

### Frontend (Vercel)
- [ ] `VITE_API_URL` — `https://lifeverse-api.onrender.com/api`
- [ ] `VITE_GOOGLE_CLIENT_ID` — same as backend

---

## Costs (free tier)

| Service | Free tier limits |
|---------|------------------|
| Vercel | Unlimited hobby projects |
| Render | 750 hrs/month, sleeps after 15 min idle |
| Neon | 0.5 GB storage, always on |

> Render free tier **sleeps** when idle — first request after sleep takes ~30 seconds.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `401: invalid_client` | Replace `REPLACE_ME` with real Google Client ID |
| `CORS blocked` | Set `FRONTEND_URL` on Render to exact Vercel URL |
| `Database connection failed` | Check `DATABASE_URL`, add `?sslmode=require` for Neon |
| API returns HTML not JSON | Wrong `VITE_API_URL` — must end with `/api` |
| Google works locally but not prod | Add Vercel URL to Google authorized origins |
| Render slow first load | Free tier cold start — normal, wait 30s |

---

## Custom domain (optional)

**Vercel:** Settings → Domains → add `lifeverse.com`  
**Render:** Settings → Custom Domain → add `api.lifeverse.com`  
**Google OAuth:** Add new origins for custom domains  
**Update env:** `FRONTEND_URL` and `VITE_API_URL` with new domains
