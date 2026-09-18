/**
 * Jest global setup: connects to the test database, resets state per suite
 * and builds all model indexes (including the transaction-critical uniques).
 */
const mongoose = require('mongoose');
require('../src/config/db'); // registers all models

jest.setTimeout(60000);

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  await mongoose.connection.db.dropDatabase();

  for (const model of Object.values(mongoose.models)) {
    // eslint-disable-next-line no-await-in-loop
    await model.syncIndexes();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
