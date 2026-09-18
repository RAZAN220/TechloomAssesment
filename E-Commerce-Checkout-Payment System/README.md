# 🛒 TechMart — MERN E-Commerce Checkout & Payment System

A complete, production-style **E-Commerce Checkout & Mock Payment System** built with the MERN stack (MongoDB, Express, React, Node.js).

It covers the full shopping lifecycle: **product discovery → search & filters → product details → cart → checkout with 5-minute stock reservation → mock payment → order management → cancellation → refund simulation → order history**, with concurrency-safe inventory, idempotent payment/refund operations and JWT-protected, role-aware APIs.

> 📌 **Status:** This README is updated as phases are delivered. Full API documentation, database design, order-state rules, testing and deployment guides land in Phase 10.

---

## ✨ Features (final scope)

| Area | Highlights |
| --- | --- |
| Authentication | Register, login, JWT auth, bcrypt password hashing, protected routes, role-based (admin) access |
| Product discovery | Search, category/price/availability filters, sorting, pagination, admin product management |
| Cart | Per-user cart, quantity updates, server-side price/stock revalidation at checkout |
| Checkout | Unique checkout session, MongoDB transactions, atomic stock reservation, immutable order snapshot, 5-minute reservation expiry |
| Payments | Mock gateway (success / failure / timeout), idempotency keys, duplicate-payment protection, amount & ownership validation |
| Orders | History, details, state-machine enforced transitions, cancellation eligibility rules |
| Refunds | Idempotent mock refunds for cancelled paid orders |
| Security | Centralized error handling, input validation, rate limiting, CORS, helmet, hashed passwords, no secrets in git |

---

## 🧰 Technology stack

- **Frontend:** React 18, React Router 6, axios, custom CSS (responsive, mobile-first)
- **Backend:** Node.js, Express.js, Mongoose, JWT, bcryptjs
- **Database:** MongoDB (local Windows service / Docker / Atlas)
- **Tooling:** concurrently (dev orchestration), nodemon, Jest + Supertest (tests)

---

## 📁 Project structure

```
E-Commerce-Checkout-Payment System/
│
├── Backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection
│   │   ├── models/          # User, Product, Cart, Order, Payment, Refund
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # REST route definitions
│   │   ├── services/        # Business logic (checkout, payments, refunds, inventory)
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── utils/           # Tokens, API responses, constants
│   │   └── jobs/            # Reservation expiry worker
│   ├── server.js            # Entry point
│   └── .env.example         # Environment template (no real secrets)
│
├── Frontend/
│   ├── public/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       ├── services/        # API clients
│       ├── context/         # Auth & Cart contexts
│       ├── hooks/           # Custom hooks
│       └── utils/           # Helpers (currency formatting etc.)
│
├── package.json             # Root scripts (concurrently)
└── README.md
```

---

## 🚀 Getting started

### Prerequisites

- **Node.js ≥ 18** (npm ≥ 9)
- **MongoDB** running locally (Windows service, e.g. on port `27017`) **or** a MongoDB Atlas cluster
- Git

### 1. Install dependencies

```bash
npm run install:all        # installs Backend, Frontend and root (concurrently)
```

Or manually:

```bash
cd Backend  && npm install
cd ../Frontend && npm install
```

### 2. Configure environment variables

```bash
# Backend
cp Backend/.env.example Backend/.env
#   → set MONGO_URI, JWT_SECRET, CLIENT_URL

# Frontend
cp Frontend/.env.example Frontend/.env
#   → set REACT_APP_API_URL (default http://localhost:5000/api)
```

### 3. Run the app

```bash
npm run dev      # starts Backend (http://localhost:5000) + Frontend (http://localhost:3000)
```

| Command | Description |
| --- | --- |
| `npm run install:all` | Install dependencies for both workspaces |
| `npm run dev` | Run Backend + Frontend concurrently |
| `npm run server` | Backend only (nodemon) |
| `npm run client` | Frontend only (react-scripts) |
| `cd Backend && npm run seed` | Seed the sample product catalogue + demo accounts |

### 4. Verify the backend

```bash
curl http://localhost:5000/api/health
# → { "success": true, "status": "ok", "database": "connected", ... }
```

### 5. Seed sample data (optional)

```bash
cd Backend && npm run seed              # 18 sample products + demo accounts
cd Backend && npm run seed -- --reset   # remove the sample products, then re-create them
cd Backend && npm run seed -- --no-images   # leave product images empty (offline-friendly)
```

The seeder is **idempotent**: products are matched by name, so re-running it
refreshes prices/stock/descriptions instead of creating duplicates. It writes
straight through Mongoose (no admin account required) and seeds 6 categories,
including one out-of-stock item so the availability filter can be demoed.

It also creates two **development-only** demo accounts — there is deliberately
no admin sign-up endpoint, so the admin account is what makes `/admin/products`
reachable:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@techmart.local` | `Admin123!` |
| Customer | `customer@techmart.local` | `Customer123!` |

Use `--no-users` to skip them. Never seed these into a real deployment.

Product images are themed placeholder URLs from **picsum.photos** based on each
product's category (e.g. headphones, smartphone, laptop); the UI falls back to an
inline icon whenever an image cannot be loaded.

---

## 🗺️ Delivery phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Project structure & workspace initialization | ✅ |
| 2 | MongoDB connection, models, JWT authentication | ⏳ |
| 3 | Product discovery & admin product management | ⏳ |
| 4 | Cart management | ⏳ |
| 5 | Checkout, stock reservation, transaction-safe inventory | ⏳ |
| 6 | Mock payments (success/failure/timeout, idempotency) | ⏳ |
| 7 | Order history, cancellation, refund simulation | ⏳ |
| 8 | Complete React UI wired to all APIs | ⏳ |
| 9 | Tests, validation, security hardening | ⏳ |
| 10 | README completion & deployment readiness | ⏳ |

Sections such as **API documentation, database design, order-state transition rules, reservation & payment flow, refund behavior, timeout policy and testing instructions** are added to this README as their phases complete.

---

## 🔐 Security notes

- `.env` files are git-ignored; only `.env.example` templates are committed.
- Passwords are hashed with bcrypt and never returned by the API.
- All prices/totals are revalidated server-side; the frontend is never trusted.
- Payment and refund endpoints enforce idempotency keys and safe state transitions.
