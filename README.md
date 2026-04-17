# RedThread

A full-stack web application for managing and visualizing non-linear information via an interactive force-directed graph. Users create data nodes and link them with typed threads to map relationships.

---

## Tech Stack

**Frontend:**
- **Next.js (App Router):** React framework for routing and UI.
- **Tailwind CSS:** Utility-first styling.
- **D3.js:** Physics-based force-directed graph visualization.
- **Framer Motion:** Component animations and page transitions.

**Backend:**
- **Node.js & Express.js:** REST API handling business logic and graph state.
- **MongoDB (Mongoose):** NoSQL database storing nodes and relationship references.

**Security:**
- **Auth:** JWT stored in `httpOnly` cookies.
- **Hardening:** `helmet` (headers), `express-rate-limit` (DDoS mitigation), `express-mongo-sanitize` (NoSQL injection prevention).

---

## Core Features

- **Force-Directed Graph:** Interactive D3.js visualization with zoom, pan, and click-to-focus.
- **Node CRUD:** Manage information points with titles, descriptions, and tags.
- **Typed Connections:** Link nodes via specific thread types (e.g., influence, similarity, cause).
- **Authorization:** Strict backend validation ensures users only mutate their own records.
- **Cascade Deletion:** Deleting a node atomically removes all its associated threads.

---

## Project Structure

```text
RED_THREAD/
├── backend/                  # Express API
│   ├── src/
│   │   ├── controllers/      # Route logic
│   │   ├── middleware/       # Auth, validation, errors
│   │   ├── models/           # Mongoose schemas
│   │   └── routes/           # API endpoints
│   └── seed.js               # Dev database seeder
└── frontend/                 # Next.js App
    └── src/
        ├── app/              # App Router pages
        ├── components/       # UI elements and D3 GraphView
        └── lib/              # API and auth clients
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- npm >= 9

### 1. Setup Backend
```bash
git clone https://github.com/pauljoe2k/RED_THREAD.git
cd RED_THREAD/backend
cp .env.example .env
npm install
```
Update `.env` (Never commit real secrets):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/redthread
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### 2. Setup Frontend
```bash
cd ../frontend
cp .env.local.example .env.local
npm install
```
Update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Seed Database (Dev Only)
Creates isolated test accounts and initial graph data. Disable in production.
```bash
cd ../backend
npm run seed
```

### 4. Run Locally
Terminal 1 (Backend):
```bash
cd backend
npm run dev
```
Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
Access the application at `http://localhost:3000`.

---

## API Overview

Requires JWT `httpOnly` cookie.

**Auth:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

**Nodes:**
- `GET /api/nodes`
- `POST /api/nodes`
- `GET /api/nodes/:id`
- `PUT /api/nodes/:id`
- `DELETE /api/nodes/:id`

**Threads:**
- `GET /api/threads`
- `POST /api/threads`
- `DELETE /api/threads/:id`
- `GET /api/threads/node/:nodeId`

---

## Production Security Notes

- **Secrets:** Use >= 64-byte `JWT_SECRET` keys and do not commit `.env` files.
- **Cookies:** Enforce `secure: true` for HTTPS-only transmission.
- **Database:** Restrict MongoDB access to application IPs via allowlisting.
- **API Defense:** Maintain active rate limiting, strict schema validation, and NoSQL sanitization across all routes.

---

## Deployment

- **Backend (Render):** Set environment variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`). See `backend/DEPLOYMENT.md`.
- **Frontend (Vercel):** Set `NEXT_PUBLIC_API_URL`. See `frontend/DEPLOYMENT.md`.

---

## License

MIT License.
