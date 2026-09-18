require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const { connectDB } = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { expireReservedOrders } = require('./services/reservationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Vite falls back to another port (5174, 5175, ...) whenever 5173 is already
// in use, so the dev frontend is not guaranteed to run on 5173. Accept any
// localhost/127.0.0.1 port plus the configured CLIENT_URL instead of a fixed
// port list, so the app keeps working without editing the .env file.
const allowedOrigins = new Set(
  [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean)
);
const isAllowedOrigin = (origin) =>
  allowedOrigins.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (curl, same-origin tools) pass too.
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'POS API is running' });
});

app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function runReservationExpiry() {
  try {
    await expireReservedOrders();
  } catch (error) {
    console.error('Scheduled expiry job failed:', error.message);
  }
}

function scheduleReservationExpiry() {
  // Check frequently so a five-minute hold is released promptly. Payment also
  // expires a stale reservation synchronously, so a late gateway callback can
  // never retain or re-release stock.
  return cron.schedule('*/10 * * * * *', runReservationExpiry);
}

async function startServer() {
  try {
    await connectDB();
    await expireReservedOrders();
    scheduleReservationExpiry();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, runReservationExpiry, scheduleReservationExpiry, startServer };
