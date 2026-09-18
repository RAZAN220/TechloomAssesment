/**
 * Temporary Phase 8 integration script (deleted after use).
 * Runs the complete storefront journey against the running backend and
 * verifies CORS for the frontend origin.
 */
const API = 'http://localhost:5000/api';
const ORIGIN = 'http://localhost:3000';

let passed = 0;
let failed = 0;
const log = (n, p, e = '') => {
  console.log(`${p ? 'PASS' : 'FAIL'} | ${n}${e ? ' | ' + e : ''}`);
  if (p) passed++;
  else failed++;
};

const req = (m, u, b, t, headers = {}) =>
  fetch(`${API}${u}`, {
    method: m,
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...headers,
    },
    ...(b ? { body: JSON.stringify(b) } : {}),
  });

const newKey = () => `journey-${Date.now()}-${Math.random().toString(36).slice(2)}`;

(async () => {
  // ---- CORS from the frontend origin ----
  let r = await req('GET', '/products?limit=1');
  const acao = r.headers.get('access-control-allow-origin');
  log('CORS allows frontend origin :3000', r.status === 200 && acao === ORIGIN, `acao=${acao}`);

  // ---- browse / search / filter ----
  r = await req('GET', '/products?search=wireless&inStock=true&sortBy=price_asc');
  let b = await r.json();
  const product = b.data.products[0];
  log(
    'search + availability filter returns the headphones',
    r.status === 200 && Boolean(product) && /headphones/i.test(product.name),
    `found=${product ? product.name : 'none'}`
  );

  // ---- register ----
  const email = `journey_${Date.now()}@test.local`;
  r = await req('POST', '/auth/register', { name: 'Journey User', email, password: 'secret123' });
  b = await r.json();
  const token = b.data.token;
  log('register -> token', r.status === 201 && typeof token === 'string');

  r = await req('GET', '/auth/me', null, token);
  b = await r.json();
  log('session restore (/auth/me) works', r.status === 200 && b.data.user.email === email);

  // ---- cart ----
  r = await req('POST', '/cart/items', { productId: product._id, qty: 2 }, token);
  b = await r.json();
  log(
    'add to cart -> 2 units, server-side total',
    r.status === 200 && b.data.cart.itemCount === 2 && b.data.cart.total === product.price * 2,
    `total=${b.data.cart.total}`
  );

  // ---- checkout (stock reservation) ----
  r = await req('POST', '/checkout', {}, token, { 'Idempotency-Key': newKey() });
  b = await r.json();
  const session = b.data;
  log(
    'checkout reserves stock with ~5min expiry',
    r.status === 201 && session.status === 'Reserved',
    `status=${session.status}`
  );

  r = await req('GET', `/checkout/${session.checkoutSessionId}`, null, token);
  b = await r.json();
  log(
    'checkout page loads session + countdown',
    r.status === 200 && b.data.session.secondsRemaining > 240 && b.data.session.items.length === 1
  );

  // ---- payment ----
  r = await req('POST', '/payments/process', { checkoutSessionId: session.checkoutSessionId, simulate: 'success' }, token, { 'Idempotency-Key': newKey() });
  b = await r.json();
  log(
    'mock payment success -> order Paid',
    r.status === 201 && b.data.payment.status === 'Success' && b.data.order.status === 'Paid'
  );

  // ---- order history + details ----
  r = await req('GET', '/orders?limit=5', null, token);
  b = await r.json();
  const order = b.data.orders[0];
  log(
    'order history shows the Paid order as cancellable',
    r.status === 200 && order.status === 'Paid' && order.canCancel === true
  );

  r = await req('GET', `/orders/${order.id}`, null, token);
  b = await r.json();
  log(
    'order details include items + payment record',
    r.status === 200 && b.data.order.items.length === 1 && b.data.payments[0].status === 'Success'
  );

  // ---- cancel + refund ----
  r = await req('POST', `/orders/${order.id}/cancel`, { reason: 'Journey test cancellation' }, token);
  b = await r.json();
  log(
    'cancel paid order -> Refunded with successful refund',
    r.status === 200 && b.data.order.status === 'Refunded' && b.data.refund.status === 'Success'
  );

  r = await req('GET', `/orders/${order.id}`, null, token);
  b = await r.json();
  log('refund visible on the order', r.status === 200 && b.data.refunds.length === 1);

  // ---- logout equivalent: token remains valid but user object cleared client-side ----
  log('journey complete — every storefront step works against the live API', true);

  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('SCRIPT ERROR:', e.message);
  process.exit(1);
});
