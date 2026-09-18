/**
 * Refund service — simulated refunds with strict idempotency.
 *
 * Behavior (documented in README):
 *  - Only orders with a SUCCESS payment and status Paid/Cancelled/Refunded
 *    are refund-eligible.
 *  - The default idempotency key is derived from the successful payment, so
 *    one payment can never be refunded twice; custom keys are honored for
 *    client-driven retries.
 *  - Amount is always the paid amount captured on the successful payment.
 *  - No real money moves; the mock gateway resolves refunds as Success.
 *  - Already-refunded orders replay their existing refund (idempotent).
 */
const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { ApiError } = require('../utils/apiResponse');
const { ORDER_STATUS } = require('../utils/constants');

const createRefund = async ({ userId, orderId, idempotencyKey, reason }) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw ApiError.badRequest('Invalid order id');
  }

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  const successPayment = await Payment.findOne({ order: order._id, status: 'Success' });
  if (!successPayment) {
    throw ApiError.conflict('Refund requires a successful payment');
  }

  const Refund = mongoose.model('Refund');
  const key =
    idempotencyKey ||
    `refund-${successPayment.idempotencyKey || String(successPayment._id)}`;

  // Idempotent replay
  const existing = await Refund.findOne({ idempotencyKey: key });
  if (existing) {
    return { refund: existing, replayed: true };
  }

  if (order.status === ORDER_STATUS.RESERVED || order.status === ORDER_STATUS.FAILED || order.status === ORDER_STATUS.EXPIRED) {
    throw ApiError.conflict(`Order with status "${order.status}" is not refund-eligible`);
  }

  // Mark the order refunded if it is still Paid (Paid -> Refunded via Cancelled)
  if (order.status === ORDER_STATUS.PAID) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const cancelled = await Order.findOneAndUpdate(
          { _id: order._id, status: ORDER_STATUS.PAID },
          { $set: { status: ORDER_STATUS.CANCELLED, cancelledAt: new Date() } },
          { new: true, session }
        );
        if (!cancelled) {
          throw ApiError.conflict('Order state changed concurrently, please retry');
        }

        // Create + resolve the refund in the same transaction
        const [refund] = await Refund.create(
          [
            {
              order: order._id,
              payment: successPayment._id,
              user: userId,
              idempotencyKey: key,
              amount: successPayment.amount,
              status: 'Pending',
              reason: reason || 'Refund requested',
            },
          ],
          { session }
        );

        await Refund.updateOne(
          { _id: refund._id },
          {
            $set: {
              status: 'Success',
              refundReference: `RFND-${crypto.randomUUID()}`,
              processedAt: new Date(),
            },
          },
          { session }
        );

        await Order.updateOne(
          { _id: order._id, status: ORDER_STATUS.CANCELLED },
          { $set: { status: ORDER_STATUS.REFUNDED, refundedAt: new Date() } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  } else {
    // Cancelled/Refunded without a recorded refund (e.g. cancelled-then-refund flow)
    const stillNoRefund = !(await Refund.findOne({ idempotencyKey: key }));
    if (stillNoRefund) {
      const [refund] = await Refund.create([
        {
          order: order._id,
          payment: successPayment._id,
          user: userId,
          idempotencyKey: key,
          amount: successPayment.amount,
          status: 'Success',
          refundReference: `RFND-${crypto.randomUUID()}`,
          reason: reason || 'Refund requested',
          processedAt: new Date(),
        },
      ]);
      return { refund, replayed: false };
    }
  }

  const refund = await Refund.findOne({ idempotencyKey: key });
  return { refund, replayed: false };
};

module.exports = { createRefund };
