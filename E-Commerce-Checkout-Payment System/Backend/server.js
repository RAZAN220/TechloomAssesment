/**
 * Server entry point.
 * Loads environment variables, connects to MongoDB, then starts the Express app.
 * Includes graceful shutdown and global error safeguards.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const {
  startReservationExpiryJob,
  stopReservationExpiryJob,
} = require('./src/jobs/reservationExpiryJob');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

let server;

const start = async () => {
  try {
    await connectDB();

    startReservationExpiryJob(30 * 1000);

    server = app.listen(PORT, HOST, () => {
      const baseUrl =
        process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

      console.log(
        `✅ API server running in ${process.env.NODE_ENV || 'development'} mode`
      );
      console.log(`🌐 Server URL: ${baseUrl}`);
      console.log(`⏰ Reservation expiry job is running every 30 seconds`);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('💥 Unhandled Promise Rejection:', reason);

      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });

    process.on('uncaughtException', (err) => {
      console.error('💥 Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

const shutdown = (signal) => {
  console.log(`\n${signal} received. Closing server gracefully...`);

  stopReservationExpiryJob();

  if (!server) {
    process.exit(0);
  }

  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err.message);
    }

    process.exit(0);
  });

  // Force exit if graceful close hangs
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();