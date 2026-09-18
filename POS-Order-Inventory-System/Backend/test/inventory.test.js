const { after, test } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const { reserveStockForOrder, releaseOrderStock } = require('../src/services/inventoryService');
const { expireReservedOrders } = require('../src/services/reservationService');
const request = require('supertest');

async function setupDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect('mongodb://127.0.0.1:27017/pos_inventory_test');
  }
  await Promise.all([Product.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({})]);
}

after(async () => {
  await mongoose.disconnect();
});

test('Product CRUD flow and stock route', async () => {
  await setupDb();

  const createRes = await request(app)
    .post('/api/products')
    .send({ name: 'Laptop', price: 100000, stock: 2 });

  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.data.stock, 2);

  const listRes = await request(app).get('/api/products');
  assert.equal(listRes.status, 200);
  assert.equal(listRes.body.data.length, 1);

  const stockRes = await request(app).get(`/api/products/${createRes.body.data._id}/stock`);
  assert.equal(stockRes.status, 200);
  assert.equal(stockRes.body.data.stock, 2);
});

test('Checkout reserves stock and rejects insufficient stock', async () => {
  await setupDb();

  const product = await Product.create({ name: 'Mouse', price: 40, stock: 1 });

  const createCart = await request(app).post('/api/carts').send();
  const cartId = createCart.body.data.cartId;

  await request(app).post(`/api/carts/${cartId}/items`).send({ productId: product._id, quantity: 1 });
  const checkout = await request(app).post('/api/orders/checkout').send({ cartId });
  assert.equal(checkout.status, 201, JSON.stringify(checkout.body));
  assert.equal(checkout.body.data.status, 'Reserved');

  const productAfter = await Product.findById(product._id);
  assert.equal(productAfter.stock, 0);

  const secondCart = await request(app).post('/api/carts').send();
  const secondCartId = secondCart.body.data.cartId;
  await request(app).post(`/api/carts/${secondCartId}/items`).send({ productId: product._id, quantity: 1 });
  const insufficient = await request(app).post('/api/orders/checkout').send({ cartId: secondCartId });
  assert.equal(insufficient.status, 409);
});

test('Payment success marks order paid and failure restores stock', async () => {
  await setupDb();
  const product = await Product.create({ name: 'Monitor', price: 300, stock: 3 });

  const cart = await request(app).post('/api/carts').send();
  const cartId = cart.body.data.cartId;
  await request(app).post(`/api/carts/${cartId}/items`).send({ productId: product._id, quantity: 2 });
  const checkout = await request(app).post('/api/orders/checkout').send({ cartId });

  const orderId = checkout.body.data._id;
  const paid = await request(app).post('/api/payments').send({ orderId, outcome: 'success' });
  assert.equal(paid.status, 200);
  assert.equal(paid.body.data.status, 'Paid');

  const productAfterSuccess = await Product.findById(product._id);
  assert.equal(productAfterSuccess.stock, 1);

  const failedCheckout = await request(app).post('/api/carts').send();
  const failedCartId = failedCheckout.body.data.cartId;
  await request(app).post(`/api/carts/${failedCartId}/items`).send({ productId: product._id, quantity: 1 });
  const failedOrder = await request(app).post('/api/orders/checkout').send({ cartId: failedCartId });
  const failedPayment = await request(app).post('/api/payments').send({ orderId: failedOrder.body.data._id, outcome: 'failure' });
  assert.equal(failedPayment.status, 200);
  assert.equal(failedPayment.body.data.status, 'Failed');

  const finalProduct = await Product.findById(product._id);
  assert.equal(finalProduct.stock, 1);
});

test('Validate status transitions and duplicate payment protection', async () => {
  await setupDb();
  const product = await Product.create({ name: 'Keyboard', price: 80, stock: 5 });
  const cart = await request(app).post('/api/carts').send();
  await request(app).post(`/api/carts/${cart.body.data.cartId}/items`).send({ productId: product._id, quantity: 1 });
  const orderResponse = await request(app).post('/api/orders/checkout').send({ cartId: cart.body.data.cartId });

  const duplicatePayment = await request(app).post('/api/payments').send({ orderId: orderResponse.body.data._id, outcome: 'success' });
  assert.equal(duplicatePayment.status, 200);

  const duplicateAgain = await request(app).post('/api/payments').send({ orderId: orderResponse.body.data._id, outcome: 'success' });
  assert.equal(duplicateAgain.status, 409);

  const statusTransition = await request(app).post(`/api/orders/${orderResponse.body.data._id}/cancel`);
  assert.equal(statusTransition.status, 409);
});

test('Reserve and release stock logic works safely', async () => {
  await setupDb();
  const product = await Product.create({ name: 'Speaker', price: 120, stock: 5 });
  const order = { items: [{ productId: product._id, quantity: 2 }] };
  await reserveStockForOrder(order);
  const updated = await Product.findById(product._id);
  assert.equal(updated.stock, 3);

  await releaseOrderStock({ items: [{ productId: product._id, quantity: 2 }] });
  const restored = await Product.findById(product._id);
  assert.equal(restored.stock, 5);
});

test('Concurrent checkouts cannot oversell the final unit', async () => {
  await setupDb();
  const product = await Product.create({ name: 'Limited edition item', price: 55, stock: 1 });
  const [firstCart, secondCart] = await Promise.all([
    request(app).post('/api/carts').send(),
    request(app).post('/api/carts').send(),
  ]);

  await Promise.all([
    request(app).post(`/api/carts/${firstCart.body.data.cartId}/items`).send({ productId: product._id, quantity: 1 }),
    request(app).post(`/api/carts/${secondCart.body.data.cartId}/items`).send({ productId: product._id, quantity: 1 }),
  ]);

  const attempts = await Promise.all([
    request(app).post('/api/orders/checkout').send({ cartId: firstCart.body.data.cartId }),
    request(app).post('/api/orders/checkout').send({ cartId: secondCart.body.data.cartId }),
  ]);

  assert.deepEqual(attempts.map((response) => response.status).sort(), [201, 409]);
  assert.equal((await Product.findById(product._id)).stock, 0);
  assert.equal(await Order.countDocuments({}), 1);
});

test('A cart and a payment outcome are each processed only once', async () => {
  await setupDb();
  const product = await Product.create({ name: 'Single-submit item', price: 25, stock: 1 });
  const cart = await request(app).post('/api/carts').send();
  const cartId = cart.body.data.cartId;
  await request(app).post(`/api/carts/${cartId}/items`).send({ productId: product._id, quantity: 1 });

  const checkoutAttempts = await Promise.all([
    request(app).post('/api/orders/checkout').send({ cartId }),
    request(app).post('/api/orders/checkout').send({ cartId }),
  ]);

  assert.deepEqual(checkoutAttempts.map((response) => response.status).sort(), [201, 409]);
  const successfulCheckout = checkoutAttempts.find((response) => response.status === 201);
  const orderId = successfulCheckout.body.data._id;

  const paymentAttempts = await Promise.all([
    request(app).post('/api/payments').send({ orderId, outcome: 'failure' }),
    request(app).post('/api/payments').send({ orderId, outcome: 'failure' }),
  ]);

  assert.deepEqual(paymentAttempts.map((response) => response.status).sort(), [200, 409]);
  assert.equal((await Product.findById(product._id)).stock, 1);
  assert.equal((await Order.findById(orderId)).status, 'Failed');
});

test('Expired and cancelled reservations both restore stock exactly once', async () => {
  await setupDb();
  const product = await Product.create({ name: 'Reservation item', price: 15, stock: 2 });

  const expiredCart = await request(app).post('/api/carts').send();
  await request(app).post(`/api/carts/${expiredCart.body.data.cartId}/items`).send({ productId: product._id, quantity: 1 });
  const expiredCheckout = await request(app).post('/api/orders/checkout').send({ cartId: expiredCart.body.data.cartId });
  const expiredOrderId = expiredCheckout.body.data._id;

  await Order.updateOne({ _id: expiredOrderId }, { $set: { reservationExpiresAt: new Date(Date.now() - 1_000) } });
  assert.equal(await expireReservedOrders(), 1);
  assert.equal((await Order.findById(expiredOrderId)).status, 'Expired');
  assert.equal((await Product.findById(product._id)).stock, 2);

  const cancelCart = await request(app).post('/api/carts').send();
  await request(app).post(`/api/carts/${cancelCart.body.data.cartId}/items`).send({ productId: product._id, quantity: 1 });
  const cancelCheckout = await request(app).post('/api/orders/checkout').send({ cartId: cancelCart.body.data.cartId });
  const cancellation = await request(app).post(`/api/orders/${cancelCheckout.body.data._id}/cancel`);

  assert.equal(cancellation.status, 200);
  assert.equal(cancellation.body.data.status, 'Cancelled');
  assert.equal((await Product.findById(product._id)).stock, 2);
});
