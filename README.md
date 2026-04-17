# RedThread

> Connect the dots. Map the conspiracy.

RedThread is a full-stack web application designed to manage and visualize non-linear information. Users can create nodes of information and draw typed threads between them, exploring complex relationships through an interactive force-directed graph.

---

## Architecture and Tech Stack

The application is built on a modern JavaScript stack, divided into a React frontend and a Node.js backend.

### Frontend
- **Next.js (App Router):** Handles routing, layout management, and serving the React application.
- **Tailwind CSS:** Provides a utility-first design system for a responsive, minimalistic UI.
- **D3.js:** Powers the core visual feature: an interactive, force-directed graph. It calculates the physics of nodes (repulsion) and threads (attraction) to naturally organize data.
- **Framer Motion:** Enhances the user experience with smooth page transitions and sidebar animations without heavy performance overhead.

### Backend
- **Node.js & Express.js:** Provides a stateless REST API to handle business logic, data validation, and graph state persistence.
- **MongoDB (Mongoose):** A NoSQL database chosen for its flexible document schema. It natively supports graph-like relationships by storing node references within thread documents.

### Security
- **Authentication:** Uses JSON Web Tokens (JWT) stored exclusively in `httpOnly` cookies to prevent XSS-based token theft.
- **API Hardening:** Employs `helmet` for secure HTTP headers, `express-rate-limit` to block brute-force attacks, and `express-mongo-sanitize` to strip malicious NoSQL injection attempts.

---

## Core Features

- **Force-Directed Visualization:** Navigate data visually. The D3.js graph supports zooming, panning, and click-to-focus interactions, dynamically pulling connected nodes into view.
- **Node Management:** Create, edit, and delete discrete pieces of information (nodes) using standard CRUD operations. Each node supports a title, description, and searchable tags.
- **Typed Relationships:** Connect two nodes using threads categorized by type (e.g., influence, similarity, or cause) to establish context between data points.
- **Owner-Based Authorization:** Strict backend checks ensure users can only modify or delete nodes and threads they explicitly created.
- **Cascade Deletion:** Deleting a node automatically triggers the database to remove all connected threads, ensuring graph integrity and preventing orphaned data.

---

## Getting Started (Local Development)

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- npm >= 9

### 1. Clone the repository
```bash
git clone https://github.com/pauljoe2k/RED_THREAD.git
cd RED_THREAD
```

### 2. Configure the Backend
```bash
cd backend
cp .env.example .env
```
Open `.env` and fill in your values. Never commit `.env` files containing real secrets.
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/redthread
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### 3. Configure the Frontend
```bash
cd ../frontend
cp .env.local.example .env.local
```
Update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 5. Seed the Database (Development Only)
The seeder populates the database with test users and interconnected conspiracy nodes to bootstrap the local graph.

> Development seed data only — no default credentials exposed. The seeder creates isolated test accounts. It must never be executed in production environments. Ensure database seeding scripts are disabled in your deployment pipelines.

```bash
cd backend
npm run seed
```

### 6. Run the Application
Open two terminals to start the servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:3000`.

---

## API Endpoints

All routes (except auth) require the JWT cookie set on login.

### Auth
- `POST /api/auth/register` : Create account
- `POST /api/auth/login` : Log in (sets httpOnly cookie)
- `POST /api/auth/logout` : Log out (clears cookie)
- `GET /api/auth/me` : Get current user

### Nodes
- `GET /api/nodes` : Get all nodes (paginated)
- `POST /api/nodes` : Create a node
- `GET /api/nodes/:id` : Get single node
- `PUT /api/nodes/:id` : Update node (owner only)
- `DELETE /api/nodes/:id` : Delete node and cascade threads

### Threads
- `GET /api/threads` : Get all threads (paginated)
- `POST /api/threads` : Create a thread
- `GET /api/threads/:id` : Get single thread
- `PUT /api/threads/:id` : Update thread (owner only)
- `DELETE /api/threads/:id` : Delete thread
- `GET /api/threads/node/:nodeId` : Get threads for a specific node

---

## Production Security Notes

When migrating from development to production, strictly adhere to the following baseline:

- **Never commit `.env` files**: Ensure `.env` is explicitly ignored in source control.
- **Use strong secrets (>= 64 bytes)**: Generate cryptographically secure `JWT_SECRET` keys and rotate them periodically.
- **Enable secure, `httpOnly` cookies**: Mandate `secure: true` for session cookies to enforce HTTPS-only transmission in production.
- **Restrict DB/network access**: Use IP allowlisting (e.g., in MongoDB Atlas) to restrict database access exclusively to your application server IPs.
- **Apply rate limiting and input validation consistently**: Ensure all exposed endpoints maintain strict validation schemas and rate limits to prevent volumetric abuse.

---

## Production Deployment

Deployment guides are available in their respective directories:
- Backend: `backend/DEPLOYMENT.md`
- Frontend: `frontend/DEPLOYMENT.md`

Quick summary:
1. Deploy backend to Render, setting production environment variables.
2. Deploy frontend to Vercel, pointing `NEXT_PUBLIC_API_URL` to the Render URL.
3. Update `CLIENT_ORIGIN` on the backend to match your Vercel domain to configure CORS securely.

---

## License

MIT License.
