🛒 E-Commerce Checkout & Payment System

A full-stack MERN E-Commerce Checkout and Mock Payment System built with React, Node.js, Express.js, and MongoDB.

The project demonstrates a complete e-commerce flow including user authentication, product management, shopping cart, checkout, stock reservation, mock payment processing, orders, refunds, and automated reservation expiry.

«Note: This project uses a mock payment gateway. No real payments or charges are processed.»

---

🚀 Features

👤 Authentication & Users

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Customer and Admin roles
- User profile management

🛍️ Products

- Browse products
- View product details
- Product filtering
- Product search
- Admin product management
- Product stock management

🛒 Shopping Cart

- Add products to cart
- Update item quantities
- Remove products
- Cart validation
- Maximum cart/item quantity limits
- Stock availability validation

💳 Checkout & Payment

- Secure checkout workflow
- Stock reservation during checkout
- Reservation expiry handling
- Mock payment gateway
- Payment success/failure/timeout states
- Order creation
- Payment status tracking

📦 Orders

- View order history
- View individual order details
- Order status lifecycle
- Order cancellation
- Refund processing

🔄 Refunds

- Refund requests
- Refund status tracking
- Mock refund processing

⏱️ Reservation Expiry

- Temporary stock reservation
- Automatic reservation expiry
- Prevents unavailable stock from being purchased by multiple users

🔐 Security

- Helmet security headers
- CORS configuration
- JWT authentication
- Request validation
- Rate limiting
- Centralized error handling
- Environment variable support

---

🧰 Tech Stack

Frontend

- React 18
- React Router
- Axios
- JavaScript
- HTML5
- CSS3

Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs

Testing

- Jest
- Supertest

Development Tools

- Nodemon
- Git & GitHub
- MongoDB Atlas / MongoDB

---

🏗️ Project Structure

E-Commerce-Checkout-Payment-System/
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── scripts/
│   ├── tests/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── .env.example
│
└── .gitignore

---

🔄 Application Flow

User
  │
  ▼
Browse Products
  │
  ▼
Add to Cart
  │
  ▼
Checkout
  │
  ▼
Reserve Stock
  │
  ├── Reservation Expires ──► Release Stock
  │
  ▼
Mock Payment
  │
  ├── Success ──► Create Paid Order
  │
  ├── Failed ───► Release Reservation
  │
  └── Timeout ──► Payment Timeout
  │
  ▼
Order Management
  │
  ▼
Cancellation / Refund

---

📊 Order Status Lifecycle

Pending
   │
   ├──► Reserved
   │       │
   │       ├──► Paid
   │       │     │
   │       │     └──► Refunded
   │       │
   │       ├──► Failed
   │       ├──► Expired
   │       └──► Cancelled
   │
   ├──► Failed
   ├──► Expired
   └──► Cancelled

---

⚙️ Installation

1. Clone the repository

git clone https://github.com/RAZAN220/TechloomAssesment
cd E-Commerce-Checkout-Payment-System

2. Install Backend dependencies

cd Backend
npm install

3. Configure Backend environment

Create a ".env" file inside the "Backend" folder:

NODE_ENV=development
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=30d

CLIENT_URL=http://localhost:3000

RESERVATION_EXPIRY_MINUTES=5

CHECKOUT_RATE_LIMIT_MAX=20
PAYMENT_RATE_LIMIT_MAX=15

PAYMENT_TIMEOUT_SECONDS=6

4. Seed Products

npm run seed

5. Start Backend

Development:

npm run dev

Production:

npm start

Backend API:

http://localhost:5000

Health check:

http://localhost:5000/api/health

---

💻 Frontend Setup

Open another terminal:

cd Frontend
npm install

Create ".env":

REACT_APP_API_URL=http://localhost:5000/api

Start React:

npm start

Frontend:

http://localhost:3000

---

🧪 Testing

Backend tests can be executed with:

cd Backend
npm test

The project includes tests for:

- Authentication
- Cart functionality
- Product APIs
- API integration

---

🔒 Environment Variables

Never commit real ".env" files or secrets to GitHub.

This project already includes ".gitignore" rules for:

.env
.env.local
.env.development
.env.production

Use the provided ".env.example" files as templates.

---

🗄️ Database

The application uses MongoDB with Mongoose.

Main collections/models include:

- Users
- Products
- Carts
- Orders
- Payments
- Refunds

Checkout operations use MongoDB transactions, so the database deployment must support replica sets. MongoDB Atlas is suitable for this setup.

---

🌐 API Modules

Module| Endpoint
Authentication| "/api/auth"
Products| "/api/products"
Cart| "/api/cart"
Checkout| "/api/checkout"
Payments| "/api/payments"
Orders| "/api/orders"
Refunds| "/api/refunds"
Health Check| "/api/health"

---

🎯 Project Objectives

This project was developed to demonstrate practical implementation of:

- Full-stack MERN development
- REST API architecture
- JWT authentication
- MongoDB database design
- E-commerce business logic
- Checkout workflows
- Stock reservation
- Payment state management
- Order lifecycle management
- Refund handling
- API security
- Automated testing

---

📌 Disclaimer

This application is intended for educational and demonstration purposes.

The payment gateway is simulated and does not process real financial transactions.

---

📄 License

This project is licensed under the MIT License.


### ⭐ Suggested GitHub repository description

```text
Full-stack MERN E-Commerce Checkout & Mock Payment System with JWT authentication, cart, stock reservation, checkout, orders, refunds, and automated testing.

🏷️ Suggested GitHub topics

mern
react
nodejs
express
mongodb
mongoose
ecommerce
checkout
payment-system
mock-payment
jwt
rest-api
javascript
full-stack
