/**
 * MongoDB connection helper.
 * The application refuses to start without a database connection.
 * Also registers every model up-front so lazy `mongoose.model('X')` lookups
 * (e.g. Refund inside services) always resolve.
 */
const mongoose = require('mongoose');

// Model registration (imports run the schema definitions)
require('../models/User');
require('../models/Product');
require('../models/Cart');
require('../models/Order');
require('../models/Payment');
require('../models/Refund');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      'MONGO_URI is not defined. Copy Backend/.env.example to Backend/.env and set it.'
    );
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri);

  console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

module.exports = connectDB;
