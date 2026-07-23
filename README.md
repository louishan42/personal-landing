# LifeVerse

**Your universe. Your story.**

> **Local setup:** [SETUP.md](./SETUP.md) — fix Google OAuth Client ID to enable sign-in  
> **Deploy:** [DEPLOY.md](./DEPLOY.md) — Vercel + Render + Neon PostgreSQL

LifeVerse is a personal life journal and social platform. Document real moments, build your timeline, and connect with people in your life. Everything starts at zero and grows as you use it.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS → **Vercel** |
| Backend | Node.js, Express → **Render** |
| Database | PostgreSQL → **Neon** (or Render PostgreSQL) |
| Auth | Google Sign-In (Gmail) + Admin password login |

## Authentication

- **Users** — Google Sign-In only (@gmail.com)
- **Admin** — Password at `/admin/login`
- **Usernames** — Unique, chosen after first Google sign-in

## Quick start (local)

```bash
docker compose up -d
cd backend && npm install && npx prisma db push && npm run dev
cd frontend && npm install && npm run dev
```

Open http://localhost:3000

## Project structure

```
lifeverse/
├── frontend/          → Vercel
├── backend/           → Render
├── render.yaml        → Render blueprint
├── docker-compose.yml → Local PostgreSQL
├── SETUP.md           → Local + Google OAuth fix
└── DEPLOY.md          → Production deployment guide
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Google Sign-In (Gmail only) |
| `/setup-profile` | Choose unique username |
| `/admin/login` | Admin password login |
| `/admin` | Admin dashboard |
| `/` | Home feed |
| `/profile` | Your profile |
| `/timeline` | Life timeline |
| `/map` | Life map |
