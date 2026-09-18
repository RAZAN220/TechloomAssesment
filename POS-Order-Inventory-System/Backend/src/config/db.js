const mongoose = require('mongoose');
const dns = require('dns');

// Fix Node.js SRV DNS resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

module.exports = { connectDB };

