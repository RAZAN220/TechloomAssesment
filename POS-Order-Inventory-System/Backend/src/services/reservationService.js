const Order = require('../models/Order');
const { createHttpError, releaseOrderStock, validateStatusTransition, withTransaction } = require('./inventoryService');

/**
 * Expires one reservation in a transaction. The status predicate acts as a
 * claim: only the request that moves Reserved -> Expired can restore stock.
 */
async function expireReservation(orderId, now = new Date()) {
  return withTransaction(async (session) => {
    const order = await Order.findOne({
      _id: orderId,
      status: 'Reserved',
      reservationExpiresAt: { $lte: now },
    }).session(session);

    if (!order) return null;

    validateStatusTransition(order.status, 'Expired');

    const update = await Order.updateOne(
      {
        _id: order._id,
        status: 'Reserved',
        reservationExpiresAt: { $lte: now },
      },
      { $set: { status: 'Expired', paymentStatus: 'timeout' } },
      { session }
    );

    if (update.modifiedCount !== 1) {
      throw createHttpError('Order state changed while its reservation was expiring.', 409);
    }

    await releaseOrderStock(order, session);
    return { ...order.toObject(), status: 'Expired', paymentStatus: 'timeout' };
  });
}

async function expireReservedOrders() {
  const now = new Date();
  const candidates = await Order.find({
    status: 'Reserved',
    reservationExpiresAt: { $lte: now },
  }).select('_id').lean();

  let expiredCount = 0;

  for (const candidate of candidates) {
    try {
      const expiredOrder = await expireReservation(candidate._id, now);
      if (expiredOrder) expiredCount += 1;
    } catch (error) {
      // A payment or cancellation can win the same state-transition race. In
      // that case no stock is touched twice; log unexpected failures for retry.
      if (error.statusCode !== 409) {
        console.error('Reservation expiry failed for order', candidate._id, error.message);
      }
    }
  }

  return expiredCount;
}

module.exports = { expireReservation, expireReservedOrders };
