/**
 * Shared test helpers — API client, user/admin factories and catalog seeding.
 */
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

const api = () => request(app);

let counter = 0;
const uniqueEmail = (prefix) => {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}@test.local`;
};

const registerUser = async (overrides = {}) => {
  const email = overrides.email || uniqueEmail('user');
  const res = await api()
    .post('/api/auth/register')
    .send({ name: 'Test User', email, password: 'secret123', ...overrides });
  return { token: res.body.data.token, email, user: res.body.data.user, res };
};

const createAdmin = async () => {
  const email = uniqueEmail('admin');
  await User.create({ name: 'Test Admin', email, password: 'Admin123!', role: 'admin' });
  const res = await api().post('/api/auth/login').send({ email, password: 'Admin123!' });
  return res.body.data.token;
};

const seedProduct = async (adminToken, overrides = {}) => {
  const res = await api()
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: `Test Product ${Date.now()}${Math.floor(Math.random() * 1000)}`,
      description: 'A product created by the automated test suite.',
      category: 'Testing',
      price: 10.5,
      stock: 5,
      ...overrides,
    });
  return res.body.data.product;
};

const addToCart = (token, productId, qty = 1) =>
  api().post('/api/cart/items').set('Authorization', `Bearer ${token}`).send({ productId, qty });

const getCart = (token) => api().get('/api/cart').set('Authorization', `Bearer ${token}`);

const checkout = (token, idempotencyKey) => {
  const req = api().post('/api/checkout').set('Authorization', `Bearer ${token}`);
  if (idempotencyKey) req.set('Idempotency-Key', idempotencyKey);
  return req.send({});
};

const pay = (token, checkoutSessionId, simulate, idempotencyKey, extra = {}) => {
  const req = api()
    .post('/api/payments/process')
    .set('Authorization', `Bearer ${token}`)
    .send({ checkoutSessionId, simulate, ...extra });
  if (idempotencyKey) req.set('Idempotency-Key', idempotencyKey);
  return req;
};

const stockOf = async (productId) => {
  const Product = require('../src/models/Product');
  const product = await Product.findById(productId);
  return product ? product.stock : null;
};

module.exports = {
  api,
  registerUser,
  createAdmin,
  seedProduct,
  addToCart,
  getCart,
  checkout,
  pay,
  stockOf,
  uniqueEmail,
};
