const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');

const VALID_STATUS_TRANSITIONS = {
  Pending: ['Reserved', 'Cancelled'],
  Reserved: ['Paid', 'Failed', 'Expired', 'Cancelled'],
  Paid: [],
  Failed: [],
  Expired: [],
  Cancelled: [],
};

function createHttpError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

function validateStatusTransition(currentStatus, nextStatus) {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    throw createHttpError(`Invalid order status transition: ${currentStatus} -> ${nextStatus}`, 409);
  }

  return true;
}

/**
 * Atomically decrement available stock only when enough units remain. The
 * conditional update is what prevents two simultaneous checkouts from taking
 * the same final unit.
 */
async function reserveStockForOrder(order, session = null) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    throw createHttpError('Order items are required', 400);
  }

  const operations = [];

  for (const item of order.items) {
    const productId = item.productId;
    const quantity = Number(item.quantity || 0);

    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
      throw createHttpError('Each order item must have a valid product and quantity', 400);
    }

    const result = await Product.updateOne(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      session ? { session } : undefined
    );

    if (result.matchedCount !== 1) {
      throw createHttpError(`Insufficient stock for product ${String(productId)}`, 409);
    }

    operations.push({ productId, quantity });
  }

  return operations;
}

async function releaseOrderStock(order, session = null) {
  if (!order || !Array.isArray(order.items)) return [];

  const operations = [];

  for (const item of order.items) {
    const productId = item.productId;
    const quantity = Number(item.quantity || 0);

    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
      throw createHttpError('Each order item must have a valid product and quantity', 400);
    }

    const result = await Product.updateOne(
      { _id: productId },
      { $inc: { stock: quantity } },
      session ? { session } : undefined
    );

    if (result.matchedCount !== 1) {
      throw createHttpError(`Could not restore stock for product ${String(productId)}`, 404);
    }

    operations.push({ productId, quantity });
  }

  return operations;
}

async function withTransaction(work) {
  const session = await mongoose.startSession();

  try {
    let result;
    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });
    } catch (error) {
      // Local MongoDB installations are often standalone servers. Production
      // should use a replica set (and therefore the transaction above), but
      // the guarded document updates still make the local API safe to run and
      // test without transaction support.
      if (!/Transaction numbers are only allowed on a replica set member or mongos/i.test(error.message)) {
        throw error;
      }
      result = await work(null);
    }
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Claim the Reserved -> Cancelled transition before returning stock. Both
 * operations are in one transaction, so payment, expiry, and cancellation
 * cannot release inventory more than once.
 */
async function cancelReservedOrder(orderId) {
  return withTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session);

    if (!order) throw createHttpError('Order not found', 404);

    if (order.status !== 'Reserved') {
      throw createHttpError(`Cannot cancel order in ${order.status} state.`, 409);
    }

    validateStatusTransition(order.status, 'Cancelled');

    const update = await Order.updateOne(
      { _id: order._id, status: 'Reserved' },
      { $set: { status: 'Cancelled', paymentStatus: 'pending' } },
      { session }
    );

    if (update.modifiedCount !== 1) {
      throw createHttpError('Order state changed while cancellation was processing.', 409);
    }

    await releaseOrderStock(order, session);
    return { ...order.toObject(), status: 'Cancelled', paymentStatus: 'pending' };
  });
}

async function findExistingActiveOrder(cartId) {
  return Order.findOne({
    cartId,
    status: { $in: ['Reserved', 'Paid', 'Pending'] },
  }).sort({ createdAt: -1 });
}

module.exports = {
  VALID_STATUS_TRANSITIONS,
  cancelReservedOrder,
  createHttpError,
  findExistingActiveOrder,
  releaseOrderStock,
  reserveStockForOrder,
  validateStatusTransition,
  withTransaction,
};
