# Render Deployment Guide — RedThread Backend

## Pre-flight checklist

Before deploying, ensure:
- [x] MongoDB Atlas cluster is running
- [x] Atlas IP Access: set `0.0.0.0/0` (allow all) or whitelist Render's IPs
- [x] Atlas DB user has `readWrite` on your database
- [x] Your frontend is deployed and you know its URL

---

## 1. Create a new Web Service on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repository
3. Select the `backend` directory as the **Root Directory**
4. Configure:

| Setting | Value |
|---|---|
| **Name** | `redthread-api` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Region** | Closest to your users |
| **Plan** | Free (or Starter for always-on) |

---

## 2. Set environment variables on Render

In **Environment → Environment Variables**, add all of these:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your Atlas connection string |
| `JWT_SECRET` | A 64-char random string (see below) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_ORIGIN` | Your frontend URL, e.g. `https://redthread.vercel.app` |
| `PORT` | *(leave blank — Render sets this automatically)* |

### Generate a secure JWT_SECRET

Run this locally:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 3. MongoDB Atlas — whitelist Render

Since Render's outbound IPs can change on free tier, the simplest Atlas config is:

**Network Access → Add IP → Allow access from anywhere (`0.0.0.0/0`)**

For stricter setups, use [Render's static IP add-on](https://render.com/docs/static-outbound-ip-addresses).

---

## 4. Health check

Render will automatically ping:
```
GET https://redthread-api.onrender.com/api/health
```

Expected response:
```json
{ "success": true, "status": "OK", "app": "RedThread API", "env": "production" }
```

---

## 5. After deployment — update the frontend

Set your frontend's `NEXT_PUBLIC_API_URL` to:
```
https://redthread-api.onrender.com/api
```

And set `CLIENT_ORIGIN` on Render to your frontend domain.

---

## Environment variable quick reference

```bash
# Render sets PORT automatically — do not set it manually
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/redthread?retryWrites=true&w=majority
JWT_SECRET=<64-char random hex>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-frontend.vercel.app
```

> **Security note:** `NODE_ENV=production` activates:
> - No stack traces in API error responses
> - Reduced startup logging
> - Production-level error masking
