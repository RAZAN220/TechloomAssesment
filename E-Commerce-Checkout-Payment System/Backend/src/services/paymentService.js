/**
 * Mock payment gateway service.
 *
 * Protections implemented here:
 *  - Idempotency key: the same key always replays the same payment result and
 *    can never create a second charge (unique index + race-safe recovery).
 *  - Duplicate-payment prevention: an already-Paid session replays its
 *    successful payment instead of charging again.
 *  - Amount validation: the server-computed order total is authoritative.
 *  - Ownership validation: payments target only the caller's checkout session.
 *  - State-machine gate: only "Reserved" sessions are payable; the success
 *    path flips Reserved -> Paid with a conditional atomic update, so a late,
 *    duplicate or expired attempt can NEVER mark an order Paid.
 *  - Failure/Timeout: Reserved -> Failed with stock released exactly once
 *    (conditional update + stock restore inside one transaction).
 *
 * Timeout policy: the simulated gateway sleeps PAYMENT_TIMEOUT_SECONDS then
 * resolves the attempt as "Timeout" — the request is never held indefinitely,
 * the session is finalized as unsuccessful and its stock is released. Any
 * retry requires a new checkout session (the order is terminal Failed).
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const { ApiError } = require('../utils/apiResponse');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const PAYMENT_TIMEOUT_SECONDS = parseInt(process.env.PAYMENT_TIMEOUT_SECONDS || '6', 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const newTxRef = (prefix) => `${prefix}-${crypto.randomUUID()}`;

const loadOwnedOrder = async (userId, checkoutSessionId) => {
  const order = await Order.findOne({ checkoutSessionId, user: userId });
  if (!order) {
    throw ApiError.notFound('Checkout session not found');
  }
  return order;
};

// @returns { payment, order, replayed }
const processPayment = async ({ userId, checkoutSessionId, simulate, amount, idempotencyKey }) => {
  const order = await loadOwnedOrder(userId, checkoutSessionId);

  // 1) Idempotent replay by key — same key always yields the same result
  if (idempotencyKey) {
    const existing = await Payment.findOne({ idempotencyKey });
    if (existing) {
      return { payment: existing, order: await Order.findById(order._id), replayed: true };
    }
  }

  // 2) Duplicate-payment prevention per session — already paid
  if (order.status === ORDER_STATUS.PAID) {
    const successPayment = await Payment.findOne({
      order: order._id,
      status: PAYMENT_STATUS.SUCCESS,
    });
    if (successPayment) {
      return { payment: successPayment, order, replayed: true };
    }
  }

  // 3) Valid state gate — only Reserved sessions are payable
  if (order.status !== ORDER_STATUS.RESERVED) {
    throw ApiError.conflict(`Payment not allowed: checkout session is "${order.status}"`);
  }

  // 4) Amount validation — server-side total is the source of truth
  if (amount !== undefined && amount !== null && Number(amount) !== order.total) {
    throw ApiError.badRequest(
      `Payment amount (${amount} cents) does not match order total (${order.total} cents)`
    );
  }

  // 5) Create the charge record (unique idempotency key => race-safe)
  const key = idempotencyKey || crypto.randomUUID();
  let payment;
  try {
    [payment] = await Payment.create([
      {
        order: order._id,
        user: userId,
        checkoutSessionId,
        idempotencyKey: key,
        amount: order.total,
        status: PAYMENT_STATUS.PENDING,
      },
    ]);
  } catch (err) {
    if (err && err.code === 11000) {
      const existing = await Payment.findOne({ idempotencyKey: key });
      if (existing) {
        return { payment: existing, order: await Order.findById(order._id), replayed: true };
      }
    }
    throw err;
  }

  // 6) Simulated gateway latency (timeout simulations last longer)
  if (simulate === 'timeout') {
    await sleep(PAYMENT_TIMEOUT_SECONDS * 1000);
  } else {
    await sleep(400 + Math.floor(Math.random() * 500));
  }

  if (simulate === 'success') {
    await finalizeSuccess(payment, order);
  } else if (simulate === 'failure') {
    await finalizeUnsuccessful(payment, order, PAYMENT_STATUS.FAILED, 'Simulated card decline');
  } else {
    await finalizeUnsuccessful(
      payment,
      order,
      PAYMENT_STATUS.TIMEOUT,
      'Payment timed out (simulated)'
    );
  }

  const [freshPayment, freshOrder] = await Promise.all([
    Payment.findById(payment._id),
    Order.findById(order._id),
  ]);
  return { payment: freshPayment, order: freshOrder, replayed: false };
};

/**
 * Success path: Reserved -> Paid with a conditional atomic update.
 * Reserved stock was already decremented at checkout; finalizing converts
 * the reservation into a sale (no stock change).
 */
const finalizeSuccess = async (payment, order) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const paid = await Order.findOneAndUpdate(
        { _id: order._id, status: ORDER_STATUS.RESERVED },
        { $set: { status: ORDER_STATUS.PAID, paidAt: new Date() } },
        { new: true, session }
      );

      if (!paid) {
        // Order changed concurrently (expired/cancelled/paid elsewhere) —
        // never double-charge: reverse this charge instead.
        await Payment.updateOne(
          { _id: payment._id, status: PAYMENT_STATUS.PENDING },
          {
            $set: {
              status: PAYMENT_STATUS.FAILED,
              failureReason: 'Order no longer payable (state changed concurrently)',
              processedAt: new Date(),
            },
          },
          { session }
        );
        return;
      }

      await Payment.updateOne(
        { _id: payment._id },
        {
          $set: {
            status: PAYMENT_STATUS.SUCCESS,
            transactionReference: newTxRef('TXN'),
            processedAt: new Date(),
          },
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Failure/Timeout path: Reserved -> Failed + release reserved stock
 * exactly once (conditional update + restore inside one transaction).
 * If the reservation was already finalized elsewhere, only the payment
 * record is updated — stock is never double-released.
 */
const finalizeUnsuccessful = async (payment, order, paymentStatus, reason) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const failed = await Order.findOneAndUpdate(
        { _id: order._id, status: ORDER_STATUS.RESERVED },
        { $set: { status: ORDER_STATUS.FAILED } },
        { new: true, session }
      );

      if (failed) {
        for (const item of failed.items) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.qty } },
            { session }
          );
        }
      }

      await Payment.updateOne(
        { _id: payment._id, status: PAYMENT_STATUS.PENDING },
        { $set: { status: paymentStatus, failureReason: reason, processedAt: new Date() } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
};

const getPaymentView = async (user, paymentId) => {
  if (!mongoose.isValidObjectId(paymentId)) {
    throw ApiError.badRequest('Invalid payment id');
  }

  const payment = await Payment.findById(paymentId).lean();
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  // Ownership check — do not leak the existence of other users' payments
  if (String(payment.user) !== String(user._id) && user.role !== 'admin') {
    throw ApiError.notFound('Payment not found');
  }

  return payment;
};

module.exports = { processPayment, getPaymentView };

