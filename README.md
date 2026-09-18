# TECHLOOM.AI — Software Engineer Intern Practical Assessment

Full-stack implementation of the **TECHLOOM.AI Software Engineer Intern Practical Assessment**, covering both required sections.

## 🔗 Live Demo & Repository

| Project                                            | Link                                                         |
| -------------------------------------------------- | ------------------------------------------------------------ |
| **GitHub Repository**                              | https://github.com/RAZAN220/TechloomAssesment                |
| **Task 01 — POS Order & Inventory System**         | https://techloom-assesment.vercel.app/                       |
| **Task 02 — E-Commerce Checkout & Payment System** | https://techloom-assesment-hb83-66uokrxa0-razan2.vercel.app/ |
| **LinkedIn**                                       | https://www.linkedin.com/in/mohamathrazan/                   |

---

# 📌 Assessment Overview

This repository contains both sections of the TECHLOOM.AI Software Engineer Intern Practical Assessment.

### Section 01

**POS Order & Inventory System**

A concurrency-safe POS system with inventory management, stock reservation, mock payments, and order lifecycle management.

### Section 02

**E-Commerce Checkout & Payment System**

A customer-facing e-commerce application with product discovery, cart management, checkout, stock reservation, mock payments, refunds, cancellation, and order history.

---

# 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3

### Backend

* Node.js
* Express.js
* REST API

### Database

* MongoDB

### Deployment

* Vercel
* Render

---

# 📁 Repository Structure

```text
TechloomAssesment/
│
├── POS-Order-Inventory-System/
│   ├── Backend/
│   ├── Frontend/
│   └── README.md
│
├── E-Commerce-Checkout-Payment System/
│   ├── Backend/
│   ├── Frontend/
│   └── README.md
│
└── README.md
```

---

# 01 — POS Order & Inventory System

## Overview

A POS order and inventory management system designed to handle simultaneous purchase requests while maintaining accurate inventory and preventing overselling.

## Features

### Product & Inventory Management

* Create products
* Read/view products
* Update products
* Delete products
* Product name
* Product price
* Available stock
* Current stock display

### Cart & Order

* Add products to cart
* Update cart quantities
* Remove products from cart
* Convert cart into an order
* Validate stock before checkout

### Stock Reservation

* Stock is reserved when checkout begins
* Reservation period: **5 minutes**
* Expired reservations release stock
* Prevents reserved stock from being purchased by another order

### Mock Payment

The system supports:

* Payment Success
* Payment Failure
* Payment Timeout

Payment handling:

| Payment Result | Order Status | Stock                            |
| -------------- | ------------ | -------------------------------- |
| Success        | Paid         | Reserved stock remains committed |
| Failure        | Failed       | Stock released                   |
| Timeout        | Expired      | Stock released                   |

### Order Lifecycle

Supported order statuses:

```text
Pending
Reserved
Paid
Failed
Expired
Cancelled
```

The system validates order status transitions and rejects invalid transitions.

### Concurrency & Data Integrity

The implementation focuses on:

* Stock availability validation
* Preventing overselling
* Atomic inventory updates
* Duplicate order prevention
* Duplicate payment prevention
* Consistent order and inventory state
* Error handling during order processing

---

# 02 — E-Commerce Checkout & Payment System

## Overview

A mini e-commerce storefront implementing the complete customer shopping flow from product discovery to checkout and post-purchase order management.

## Features

### Product Discovery

* Product listing
* Product search
* Product filtering
* Availability filtering
* Product details view

### Shopping Cart

* Add products to cart
* Update quantities
* Remove products
* View cart
* Calculate order totals

### Checkout

* Checkout from cart
* Validate available stock
* Reserve stock before payment
* Process checkout lifecycle

### Mock Payment Gateway

Supports:

* Successful payment
* Failed payment
* Payment timeout
* Duplicate payment prevention

### Post-Purchase

* Order history
* Order status tracking
* Order cancellation
* Refund simulation
* Stock restoration where applicable

---

# 🔐 Order & Payment Handling

The applications implement separate handling for different payment outcomes.

```text
Checkout
   │
   ▼
Reserve Stock
   │
   ▼
Payment
 ┌─┼──────────────┐
 ▼ ▼              ▼
Success Failure  Timeout
 │     │           │
 ▼     ▼           ▼
Paid  Failed    Expired
 │     │           │
 ▼     ▼           ▼
Complete Release  Release
```

Duplicate order and payment submissions are handled to avoid creating inconsistent orders or multiple payment records.

---

# ⚙️ Environment Variables

Backend environment variables should be configured using a `.env` file.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Frontend environment variables should point to the deployed backend API.

Example:

```env
REACT_APP_API_URL=your_backend_api_url
```

> Do not commit real credentials, database passwords, API keys, or secrets to the repository.

---

# 🚀 Local Installation

## Clone Repository

```bash
git clone https://github.com/RAZAN220/TechloomAssesment.git

cd TechloomAssesment
```

---

## Task 01 — Backend

```bash
cd POS-Order-Inventory-System/Backend

npm install

npm run dev
```

---

## Task 01 — Frontend

Open a new terminal:

```bash
cd POS-Order-Inventory-System/Frontend

npm install

npm start
```

---

## Task 02 — Backend

```bash
cd "E-Commerce-Checkout-Payment System/Backend"

npm install

npm run dev
```

---

## Task 02 — Frontend

Open a new terminal:

```bash
cd "E-Commerce-Checkout-Payment System/Frontend"

npm install

npm start
```

---

# 🧪 Testing Guide

## Task 01

Test the following flow:

1. Create a product with limited stock.
2. View the current stock.
3. Add the product to a cart.
4. Proceed to checkout.
5. Verify that stock is reserved.
6. Complete a successful payment.
7. Verify that the order becomes `Paid`.
8. Test payment failure.
9. Verify that reserved stock is released.
10. Test payment timeout.
11. Verify that the reservation expires and stock is released.
12. Test order cancellation.
13. Verify stock restoration.
14. Attempt duplicate order/payment submission.
15. Test simultaneous purchase requests against limited stock.

---

## Task 02

Test the following flow:

1. Browse the product listing.
2. Search for products.
3. Apply filters.
4. Open a product details page.
5. Add a product to the cart.
6. Modify cart quantities.
7. Proceed to checkout.
8. Verify stock reservation.
9. Test successful payment.
10. Test failed payment.
11. Test payment timeout.
12. Test duplicate payment submission.
13. View order history.
14. Cancel an eligible order.
15. Test refund simulation.
16. Verify the resulting order status and inventory state.

---

# 📡 API

The applications communicate through REST APIs between the React frontend and Node.js/Express backend.

Typical operations include:

```text
Products
GET     /api/products
POST    /api/products
PUT     /api/products/:id
DELETE  /api/products/:id

Orders
POST    /api/orders
GET     /api/orders
GET     /api/orders/:id
POST    /api/orders/:id/cancel

Payments
POST    /api/payments
```

> Actual API routes may vary depending on the implementation of each task.

---

# 🔒 Data Integrity & Concurrency

The POS system is designed around the assessment requirement of preventing inventory overselling during simultaneous purchase attempts.

Key considerations include:

* Stock validation before checkout
* Inventory reservation
* Atomic stock updates
* Reservation expiry
* Payment outcome handling
* Duplicate submission prevention
* Order status validation
* Error handling to avoid inconsistent order/inventory states

---

# 🎥 Demo

Optional walkthrough/demo:

**Task 01:** Add demo video link here

**Task 02:** Add demo video link here

---

# 👨‍💻 Candidate

**Raheem Mohamath Razan**

Software Engineer Intern Candidate

**GitHub:**
https://github.com/RAZAN220

**LinkedIn:**
https://www.linkedin.com/in/mohamathrazan/

---

# ✅ Assessment Completion

* ✅ Section 01 — POS Order & Inventory System
* ✅ Section 02 — E-Commerce Checkout & Payment System
* ✅ Public GitHub Repository
* ✅ Task 01 Live Deployment
* ✅ Task 02 Live Deployment
* ✅ README Documentation
* ✅ Setup Instructions
* ✅ Feature Testing Instructions
* ✅ Mock Payment Flows
* ✅ Stock Reservation & Order Lifecycle

