/**
 * Jest environment bootstrap (runs before any module is imported).
 * Points the test suite at a dedicated database and keeps timings fast.
 */
process.env.NODE_ENV = 'test';

const base = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/ecommerce_checkout?replicaSet=rs0';
// Dedicated test database — never touches development data
process.env.MONGO_URI = process.env.MONGO_URI_TEST || base.replace(/\/([^/?]+)(\?|$)/, '/ecommerce_checkout_test$2');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Fast + deterministic test behaviour
process.env.PAYMENT_TIMEOUT_SECONDS = '1';
process.env.RESERVATION_EXPIRY_MINUTES = '5';

// Disable rate limiting interference during tests
process.env.CHECKOUT_RATE_LIMIT_MAX = '10000';
process.env.PAYMENT_RATE_LIMIT_MAX = '10000';
process.env.REFUND_RATE_LIMIT_MAX = '10000';
