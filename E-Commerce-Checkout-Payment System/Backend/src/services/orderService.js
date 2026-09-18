/**
 * Order service — history, details, state-machine-enforced cancellation.
 *
 * Valid transitions (constants.ORDER_STATUS_TRANSITIONS):
 *   Reserved -> Paid | Failed | Expired | Cancelled
 *   Paid     -> Cancelled | Refunded
 *   Cancelled-> Refunded
 *   Failed | Expired | Refunded -> terminal
 *
 * Cancellation policy:
 *   - Reserved: cancels + releases reserved stock (once) inside a transaction.
 *   - Paid: cancels + creates an idempotent refund, order -> Refunded.
 *   - Failed/Expired/Refunded/Cancelled: not cancellable (409).
 */
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { ApiError } = require('../utils/apiResponse');
const { ORDER_STATUS } = require('../utils/constants');

// @returns { orders, pagination }
const listOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const filter = { user: userId };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      hasNext: pageNum * limitNum < total,
      hasPrev: pageNum > 1,
    },
  };
};

const getOrderDetail = async (user, orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw ApiError.badRequest('Invalid order id');
  }

  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Authorization: users see only their own orders (admins may inspect any)
  if (user.role !== 'admin' && String(order.user) !== String(user._id)) {
    // 404 (not 403) to avoid leaking the existence of other users' orders
    throw ApiError.notFound('Order not found');
  }

  const [payments, refunds] = await Promise.all([
    Payment.find({ order: order._id }).sort({ createdAt: -1 }).lean(),
    mongoose.model('Refund').find({ order: order._id }).sort({ createdAt: -1 }).lean(),
  ]);

  return { order, payments, refunds };
};

/**
 * Cancels an order if allowed.
 * @returns { order, refund } refund is set when a Paid order was refunded
 */
const cancelOrder = async (userId, orderId, { reason, idempotencyKey } = {}) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw ApiError.badRequest('Invalid order id');
  }

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED) {
    throw ApiError.conflict(`Order is already ${order.status}`);
  }

  if (order.status !== ORDER_STATUS.RESERVED && order.status !== ORDER_STATUS.PAID) {
    throw ApiError.conflict(`Order with status "${order.status}" cannot be cancelled`);
  }

  const session = await mongoose.startSession();
  let refund = null;
  try {
    await session.withTransaction(async () => {
      if (order.status === ORDER_STATUS.RESERVED) {
        // Reserved -> Cancelled, release the reserved stock exactly once
        const cancelled = await Order.findOneAndUpdate(
          { _id: order._id, status: ORDER_STATUS.RESERVED },
          { $set: { status: ORDER_STATUS.CANCELLED, cancelledAt: new Date() } },
          { new: true, session }
        );
        if (!cancelled) {
          throw ApiError.conflict('Order state changed concurrently, please retry');
        }

        for (const item of cancelled.items) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.qty } },
            { session }
          );
        }
      } else {
        // Paid -> Cancelled -> Refunded with a simulated refund
        const successPayment = await Payment.findOne({
          order: order._id,
          status: 'Success',
        }).session(session);
        if (!successPayment) {
          throw ApiError.conflict('No successful payment found for this order');
        }

        const Refund = mongoose.model('Refund');
        const refundKey =
          idempotencyKey || `refund-${successPayment.idempotencyKey || String(successPayment._id)}`;

        const existingRefund = await Refund.findOne({ idempotencyKey: refundKey }).session(session);
        if (existingRefund) {
          refund = existingRefund;
          return;
        }

        const paid = await Order.findOneAndUpdate(
          { _id: order._id, status: ORDER_STATUS.PAID },
          { $set: { status: ORDER_STATUS.CANCELLED, cancelledAt: new Date() } },
          { new: true, session }
        );
        if (!paid) {
          throw ApiError.conflict('Order state changed concurrently, please retry');
        }

        [refund] = await Refund.create(
          [
            {
              order: order._id,
              payment: successPayment._id,
              user: userId,
              idempotencyKey: refundKey,
              amount: successPayment.amount,
              status: 'Pending',
              reason: reason || 'Customer cancellation',
            },
          ],
          { session }
        );

        // Simulated gateway refund — always succeeds in this mock
        await Refund.updateOne(
          { _id: refund._id },
          {
            $set: {
              status: 'Success',
              refundReference: `RFND-${refundKey}`,
              processedAt: new Date(),
            },
          },
          { session }
        );
        // Re-fetch so the response reflects the resolved refund, not the
        // in-memory creation snapshot
        refund = await Refund.findOne({ _id: refund._id }).session(session);

        // Paid -> Cancelled -> Refunded (transitions enforced in constants)
        const refunded = await Order.findOneAndUpdate(
          { _id: order._id, status: ORDER_STATUS.CANCELLED },
          { $set: { status: ORDER_STATUS.REFUNDED, refundedAt: new Date() } },
          { new: true, session }
        );
        if (!refunded) {
          throw ApiError.conflict('Order state changed concurrently, please retry');
        }

        // Inventory policy: paid goods were SOLD — cancelling does NOT restock
        // (documented in README); the refund compensates the customer instead.
      }
    });
  } finally {
    await session.endSession();
  }

  return { order: await Order.findById(order._id), refund };
};

const canCancel = (order) =>
  order.status === ORDER_STATUS.RESERVED || order.status === ORDER_STATUS.PAID;

module.exports = { listOrders, getOrderDetail, cancelOrder, canCancel };

