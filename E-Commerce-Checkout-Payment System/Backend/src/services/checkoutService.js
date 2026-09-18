/**
 * Checkout service — the transactional core of the reservation flow.
 *
 * Guarantees:
 *  - Stock is verified and reserved with an atomic conditional update
 *    ({ stock: { $gte: qty } } -> { $inc: { stock: -qty } }), so concurrent
 *    checkouts can never oversell.
 *  - Cart revalidation, reservations, order creation and cart clearing run
 *    inside a single MongoDB transaction: all-or-nothing.
 *  - The same idempotency key can never create two checkout sessions/orders.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { ApiError } = require('../utils/apiResponse');
const { ORDER_STATUS, RESERVATION_EXPIRY_MINUTES } = require('../utils/constants');

const checkoutCart = async (userId, idempotencyKey) => {
  // Idempotent replay for the same checkout key
  if (idempotencyKey) {
    const existing = await Order.findOne({
      user: userId,
      checkoutIdempotencyKey: idempotencyKey,
    });
    if (existing) {
      return { order: existing, replayed: true };
    }
  }

  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest('Your cart is empty');
      }

      const now = new Date();
      const items = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const product = await Product.findById(item.product).session(session);

        // Live revalidation — never trust stored cart snapshots
        if (!product) {
          throw ApiError.unprocessable(`"${item.name}" is no longer available`);
        }
        if (product.stock < item.qty) {
          throw ApiError.unprocessable(
            `Insufficient stock for "${product.name}". Only ${product.stock} unit(s) left.`
          );
        }

        // Atomic, concurrency-safe reservation
        const reserved = await Product.updateOne(
          { _id: product._id, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { session }
        );
        if (reserved.modifiedCount !== 1) {
          throw ApiError.unprocessable(
            `Insufficient stock for "${product.name}". Only ${product.stock} unit(s) left.`
          );
        }

        // Immutable snapshot for the order
        items.push({
          product: product._id,
          name: product.name,
          price: product.price,
          qty: item.qty,
        });
        subtotal += product.price * item.qty;
      }

      const [created] = await Order.create(
        [
          {
            user: userId,
            checkoutSessionId: crypto.randomUUID(),
            checkoutIdempotencyKey: idempotencyKey || undefined,
            items,
            subtotal,
            total: subtotal,
            status: ORDER_STATUS.RESERVED,
            reservationExpiresAt: new Date(now.getTime() + RESERVATION_EXPIRY_MINUTES * 60 * 1000),
          },
        ],
        { session }
      );

      await Cart.updateOne({ user: userId }, { $set: { items: [], total: 0 } }, { session });

      order = created;
    });
  } catch (err) {
    // Concurrent duplicate checkout with the same idempotency key: the unique
    // index aborted this transaction (stock already rolled back) — return the
    // winning order as an idempotent replay.
    if (idempotencyKey && err && err.code === 11000) {
      const existing = await Order.findOne({
        user: userId,
        checkoutIdempotencyKey: idempotencyKey,
      });
      if (existing) {
        return { order: existing, replayed: true };
      }
    }
    throw err;
  } finally {
    await session.endSession();
  }

  return { order, replayed: false };
};

// @returns full checkout-session view (order state + payment state + countdown)
const getSessionView = async (userId, checkoutSessionId) => {
  const order = await Order.findOne({ user: userId, checkoutSessionId }).lean();
  if (!order) {
    throw ApiError.notFound('Checkout session not found');
  }

  const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 }).lean();

  return {
    checkoutSessionId: order.checkoutSessionId,
    orderId: order._id,
    status: order.status,
    items: order.items,
    subtotal: order.subtotal,
    total: order.total,
    reservationExpiresAt: order.reservationExpiresAt,
    secondsRemaining: order.reservationExpiresAt
      ? Math.max(0, Math.floor((new Date(order.reservationExpiresAt) - Date.now()) / 1000))
      : null,
    payment: payment ? { id: payment._id, status: payment.status } : null,
    createdAt: order.createdAt,
  };
};

module.exports = { checkoutCart, getSessionView };
