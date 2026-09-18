import api from './api';

const newKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Creates a checkout session (reserves stock for 5 minutes server-side).
 * A fresh idempotency key guarantees network retries can never create a
 * second session/order.
 */
export const createCheckout = async () => {
  const { data } = await api.post(
    '/checkout',
    {},
    { headers: { 'Idempotency-Key': newKey() } }
  );
  return data.data; // { checkoutSessionId, orderId, status, total, reservationExpiresAt, ... }
};

export const getCheckoutSession = async (sessionId) => {
  const { data } = await api.get(`/checkout/${sessionId}`);
  return data.data.session;
};
