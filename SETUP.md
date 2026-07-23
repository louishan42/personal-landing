# LifeVerse — Local Setup

## What's running locally

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| PostgreSQL | localhost:5432 (Docker) |

---

## Fix Google Sign-In (401 invalid_client)

Your `.env` files still have the **placeholder** Client ID. Google rejects it with `401: invalid_client`.

### Quick fix (5 minutes)

1. Open **[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)**
2. **Create OAuth client ID** → Web application
3. Authorized JavaScript origin: `http://localhost:3000`
4. Copy the Client ID

5. Update **`frontend/.env`**:
   ```
   VITE_GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   ```

6. Update **`backend/.env`**:
   ```
   GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   ```

7. Restart both servers

The login page will show setup instructions until a real Client ID is added.

---

## Admin login (works without Google)

- URL: http://localhost:3000/admin/login
- Email: `admin@gmail.com`
- Password: `change-this-admin-password` (set in `backend/.env`)

---

## Start locally

```bash
# 1. Database
docker compose up -d

# 2. Backend
cd backend
npm install
npx prisma db push
npm run dev

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Deploy to production

See **[DEPLOY.md](./DEPLOY.md)** for Vercel + Render + Neon PostgreSQL.
