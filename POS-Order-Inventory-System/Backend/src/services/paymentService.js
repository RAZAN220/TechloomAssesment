const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const {
  createHttpError,
  releaseOrderStock,
  validateStatusTransition,
  withTransaction,
} = require('./inventoryService');

function toOrderPayload(order, updates) {
  return { ...order.toObject(), ...updates };
}

/**
 * Handles a simulated gateway outcome exactly once. Reserving stock happened
 * at checkout, so only failure and timeout return stock. The conditional state
 * update is performed before stock restoration and both changes commit or roll
 * back together.
 */
async function processPayment({ orderId, outcome }) {
  if (!['success', 'failure', 'timeout'].includes(outcome)) {
    throw createHttpError('Invalid payment outcome.', 400);
  }

  return withTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session);

    if (!order) throw createHttpError('Order not found', 404);

    if (order.status !== 'Reserved') {
      const duplicateMessage = order.status === 'Paid'
        ? 'Order has already been paid.'
        : `Payment can only be processed for Reserved orders. Current status: ${order.status}`;
      throw createHttpError(duplicateMessage, 409);
    }

    const now = new Date();

    // Do not permit a late payment to win over an expired reservation. Expire
    // and release it now instead of waiting for the scheduled worker.
    if (!order.reservationExpiresAt || order.reservationExpiresAt <= now) {
      validateStatusTransition(order.status, 'Expired');

      const expired = await Order.updateOne(
        { _id: order._id, status: 'Reserved' },
        { $set: { status: 'Expired', paymentStatus: 'timeout' } },
        { session }
      );

      if (expired.modifiedCount !== 1) {
        throw createHttpError('Order state changed while payment was processing.', 409);
      }

      await releaseOrderStock(order, session);
      return {
        order: toOrderPayload(order, { status: 'Expired', paymentStatus: 'timeout' }),
        rejected: true,
        message: 'Reservation has expired.',
      };
    }

    const nextStatus = outcome === 'success' ? 'Paid' : outcome === 'failure' ? 'Failed' : 'Expired';
    const paymentStatus = outcome === 'success' ? 'paid' : outcome === 'failure' ? 'failed' : 'timeout';
    const updates = { status: nextStatus, paymentStatus };

    if (outcome === 'success') {
      updates.paymentReference = `PAY-${uuidv4()}`;
    }

    validateStatusTransition(order.status, nextStatus);

    const update = await Order.updateOne(
      {
        _id: order._id,
        status: 'Reserved',
        reservationExpiresAt: { $gt: now },
      },
      { $set: updates },
      { session }
    );

    if (update.modifiedCount !== 1) {
      throw createHttpError('Order state changed or its reservation expired while payment was processing.', 409);
    }

    if (outcome !== 'success') {
      await releaseOrderStock(order, session);
    }

    return { order: toOrderPayload(order, updates) };
  });
}

module.exports = { processPayment };
