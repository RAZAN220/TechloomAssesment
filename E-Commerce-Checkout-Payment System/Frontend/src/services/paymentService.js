import api from './api';

const newKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Runs a mock gateway payment.
 * @param {object} p { checkoutSessionId, simulate: 'success'|'failure'|'timeout', amount? }
 * An idempotency key is always generated per attempt; retries with the same
 * key can never double-charge.
 */
export const processPayment = async ({ checkoutSessionId, simulate, amount }) => {
  const { data } = await api.post(
    '/payments/process',
    { checkoutSessionId, simulate, ...(amount !== undefined ? { amount } : {}) },
    { headers: { 'Idempotency-Key': newKey() } }
  );
  return data.data; // { payment, order, replayed }
};

export const getPayment = async (paymentId) => {
  const { data } = await api.get(`/payments/${paymentId}`);
  return data.data.payment;
};
