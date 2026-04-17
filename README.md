# 🔴 RedThread

> **Connect the dots. Map the conspiracy.**

RedThread is a full-stack conspiracy-board application where you create nodes of information and draw typed "red threads" between them — visualized as an interactive force-directed graph.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🕸️ **Force-directed graph** | D3.js powered graph with zoom, pan, click-to-focus, and node side panel |
| 🔐 **JWT Auth** | httpOnly cookie-based authentication — XSS-resistant |
| 🗂️ **Conspiracy Nodes** | Create, edit, delete nodes with title, description, and tags |
| 🧵 **Red Threads** | Connect nodes with typed relationships: `influence`, `similarity`, or `cause` |
| 🎨 **Smooth Animations** | Framer Motion page transitions, sidebar slide-in, card hover effects |
| 🔒 **Hardened API** | Helmet, rate limiting, NoSQL injection prevention, field whitelisting |
| 📱 **Responsive UI** | Cards view + Graph view with toggle on the dashboard |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Framer Motion, D3.js |
| **Backend** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB (Atlas in production) |
| **Auth** | JWT stored in httpOnly cookie |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize |

---

## 📁 Project Structure

```
RED_THREAD/
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── config/db.js      # MongoDB connection
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API routes
│   │   └── index.js          # App entry point
│   ├── seed.js               # Database seeder
│   └── .env.example          # Environment variable template
│
└── frontend/                 # Next.js application
    └── src/
        ├── app/              # App Router pages
        │   ├── (auth)/       # Login & Signup
        │   ├── dashboard/    # Main board (cards + graph)
        │   ├── nodes/        # Node CRUD pages
        │   └── threads/      # Thread creation
        ├── components/       # GraphView, NodeCard, Navbar, etc.
        └── lib/              # API client, auth helpers
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** — either local or [MongoDB Atlas](https://cloud.mongodb.com) (free tier works)
- **npm** ≥ 9

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/pauljoe2k/RED_THREAD.git
cd RED_THREAD
```

---

### Step 2 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/redthread
# OR use Atlas:
# MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/redthread?retryWrites=true&w=majority

JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
```

> **Generate a strong JWT secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

### Step 3 — Configure the frontend

```bash
cd ../frontend
cp .env.local.example .env.local
```

`.env.local` should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### Step 4 — Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

### Step 5 — Seed the database (optional but recommended)

The seeder creates **2 users** and **10 interconnected conspiracy nodes** so the graph is populated on first launch.

```bash
cd backend
npm run seed
```

**Seeded accounts:**

| Username | Email | Password |
|---|---|---|
| `admin` | `admin@test.com` | `password123` |
| `researcher` | `res@test.com` | `password123` |

To clear the database and re-seed:
```bash
npm run seed:clear
```

---

### Step 6 — Run the application

Open **two terminals**:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
# → API running at http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# → App running at http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## 🗺️ Application Walkthrough

```
/ → redirects based on auth status
  → /login      Sign in to your account
  → /signup     Create a new account
  → /dashboard  Your conspiracy board
       ├── Cards view: browse all nodes as cards
       └── Graph view: interactive force-directed graph
            ├── Hover node   → highlights connections
            ├── Click node   → opens side panel with details
            └── Click space  → resets focus
  → /nodes/new       Create a new conspiracy node
  → /nodes/:id       View node details + connected threads
  → /nodes/:id/edit  Edit a node (owner only)
  → /threads/new     Draw a red thread between two nodes
```

---

## 🔌 API Endpoints

All routes (except auth) require the JWT cookie set on login.

### Auth
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Log in (sets httpOnly cookie) |
| `POST` | `/api/auth/logout` | Log out (clears cookie) |
| `GET` | `/api/auth/me` | Get current user |

### Nodes
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/nodes` | Get all nodes (paginated) |
| `POST` | `/api/nodes` | Create a node |
| `GET` | `/api/nodes/:id` | Get single node |
| `PUT` | `/api/nodes/:id` | Update node (owner only) |
| `DELETE` | `/api/nodes/:id` | Delete node + cascade threads |

### Threads
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/threads` | Get all threads (paginated) |
| `POST` | `/api/threads` | Create a thread |
| `GET` | `/api/threads/:id` | Get single thread |
| `PUT` | `/api/threads/:id` | Update thread (owner only) |
| `DELETE` | `/api/threads/:id` | Delete thread |
| `GET` | `/api/threads/node/:nodeId` | Get threads for a node |

---

## 🔒 Security Features

- **httpOnly JWT cookie** — the token is never accessible via JavaScript
- **Helmet** — secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate limiting** — 100 req/15min globally; 10 req/15min on auth endpoints
- **NoSQL injection prevention** — `express-mongo-sanitize` strips `$` and `.` from input
- **Input validation** — `express-validator` enforces types, lengths, and field whitelisting on every route
- **Cascade delete** — deleting a node automatically removes all connected threads
- **Owner-only mutations** — only the creator can update or delete their nodes/threads

---

## 🌐 Production Deployment

See the full deployment guides:

- **Backend on Render:** [`backend/DEPLOYMENT.md`](./backend/DEPLOYMENT.md)
- **Frontend on Vercel:** [`frontend/DEPLOYMENT.md`](./frontend/DEPLOYMENT.md)

**Quick summary:**
1. Deploy backend to Render — set `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`
2. Deploy frontend to Vercel — set `NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com/api`
3. Update `CLIENT_ORIGIN` on Render to your Vercel domain

---

## 🧪 Testing the API manually

```bash
# Health check
curl http://localhost:5000/api/health

# Login (returns httpOnly cookie)
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'

# Get all nodes (send cookie)
curl -b cookies.txt http://localhost:5000/api/nodes
```

---

## 📄 License

MIT — feel free to use, modify, and distribute.
