# Vercel Deployment Guide — RedThread Frontend

## Pre-flight checklist

Before deploying, ensure:
- [x] The backend is deployed on Render and you have its URL
- [x] `NEXT_PUBLIC_API_URL` is ready to be set in Vercel
- [x] MongoDB Atlas is connected to the backend

---

## 1. Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
cd frontend
npx vercel
```

Follow the prompts:
- Link to your Vercel account/team
- Select "Next.js" framework (auto-detected)
- Set the **Root Directory** to `frontend` if deploying from the monorepo root

### Option B — Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Framework: **Next.js** (auto-detected)
5. Click **Deploy**

---

## 2. Set environment variables on Vercel

In **Project Settings → Environment Variables**, add:

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://redthread-api.onrender.com/api` | Production, Preview |

> **Important:** `NEXT_PUBLIC_API_URL` must be set **before** deploying, or the
> frontend will use `undefined` as the API base URL (requests will fail).
>
> After adding the variable, trigger a redeploy: **Deployments → Redeploy**.

---

## 3. Update backend CORS

After Vercel assigns your frontend a domain (e.g. `https://redthread.vercel.app`),
go to your Render backend and update:

```
CLIENT_ORIGIN=https://redthread.vercel.app
```

Then redeploy the backend on Render.

---

## 4. Local production check

Simulate exactly what Vercel will build:

```bash
cd frontend
npm run build    # must exit 0
npm run start    # test at http://localhost:3000
```

---

## 5. Environment variable reference

```bash
# .env.local (development only — never commit this file)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Vercel Dashboard (production — set via UI or CLI)
NEXT_PUBLIC_API_URL=https://redthread-api.onrender.com/api
```

---

## 6. What happens in production

| Feature | Behaviour |
|---|---|
| JWT cookie | `secure: true` — HTTPS only on Vercel |
| JWT cookie | `sameSite: 'Lax'` — protects against CSRF |
| API URL | Reads from `NEXT_PUBLIC_API_URL` env var |
| Error stacks | Never sent to the client (backend controlled) |
| Security headers | `X-Frame-Options: DENY`, `nosniff`, XSS protection |
| Page transitions | Framer Motion animations active |

---

## 7. Custom domain (optional)

In **Project Settings → Domains** on Vercel, add your custom domain.
Remember to update `CLIENT_ORIGIN` on the Render backend to match the new domain.
