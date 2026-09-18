# POS Order & Inventory System

A full-stack MERN POS application designed for safely managing products, carts, reservations, payments, and order lifecycle transitions under concurrency-safe inventory rules.

## Features

- Product CRUD with stock validation
- Cart management for add/update/remove quantity
- Checkout with atomic stock reservation
- 5-minute reservation expiry scheduling
- Order lifecycle management with restricted transitions
- Mock payment flows for success, failure, and timeout
- Dashboard summary widgets
- Responsive POS interface

## Tech Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Scheduling: node-cron
- Testing: Node.js test runner

## Folder Structure

```text
POS Order & Inventory System/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── Frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── README.md
└── .gitignore
```

## Local Setup

### Backend

```bash
cd "POS Order & Inventory System/Backend"
npm install
copy .env.example .env
npm run dev
```

### Frontend

```bash
cd "POS Order & Inventory System/Frontend"
npm install
copy .env.example .env
npm run dev
```

## Environment Variables

Backend `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/pos_inventory
PORT=5000
CLIENT_URL=http://localhost:5173
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

### Products

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `GET /api/products/:id/stock`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Carts

- `POST /api/carts`
- `POST /api/carts/:cartId/items`
- `PUT /api/carts/:cartId/items/:productId`
- `DELETE /api/carts/:cartId/items/:productId`
- `GET /api/carts/:cartId`
- `DELETE /api/carts/:cartId`

### Orders

- `POST /api/orders/checkout`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/orders/:orderId/cancel`

### Payments

- `POST /api/payments`
- `GET /api/payments/:orderId`

### Health

- `GET /api/health`

## Concurrency Strategy

Inventory updates rely on conditional MongoDB updates such as:

```js
{ _id: productId, stock: { $gte: quantity } }
```

with an increment operation that decrements the stock atomically. This prevents overselling when multiple checkout requests target the same product concurrently.

## Reservation & Stock Release Logic

- Checkout reserves stock immediately
- Reserved stock is valid for 5 minutes
- Payment success keeps stock deducted
- Payment failure or timeout restores reserved stock once
- Expired reservations restore stock exactly once
- Cancellation releases reserved inventory once

## Order Status Rules

Allowed transitions:

- Pending -> Reserved
- Pending -> Cancelled
- Reserved -> Paid
- Reserved -> Failed
- Reserved -> Expired
- Reserved -> Cancelled

Invalid transitions are rejected with `409 Conflict`.

## Deployment Notes

### MongoDB Atlas

1. Create a cluster and database user.
2. Whitelist Render and local IPs as needed.
3. Set `MONGO_URI` in backend environment variables.

### Render

- Build command: `npm install`
- Start command: `npm start`
- Ensure `PORT` is bound on `0.0.0.0`

### Vercel

- Set `VITE_API_URL` to the deployed Render backend URL.
- Ensure SPA routing rewrites are configured if necessary.

## Testing

```bash
cd "POS Order & Inventory System/Backend"
npm test
```

## Example Requests

```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":100000,"stock":2}'
```

## Known Limitations

- This implementation uses a mock payment flow and is intended to demonstrate the POS lifecycle rather than a production payment processor integration.
- MongoDB Atlas or a reachable Mongo instance is required for live backend usage.
