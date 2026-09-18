/**
 * Reservation expiry worker.
 *
 * Runs as a periodic background sweep — the backend is the single source of
 * truth (the frontend countdown is informational only).
 *
 * Idempotency: every expired Reserved order is transitioned exactly once via
 * a conditional update (status: 'Reserved') performed inside a transaction
 * that also restores the reserved stock — so a crash between the two steps
 * can never leak or double-release stock.
 *
 * Safety: if an order marked Reserved already has a SUCCESS payment (crash
 * window during payment finalization), the sweep finalizes the order as Paid
 * instead of expiring it — never releasing paid-for stock.
 */
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const BATCH_SIZE = 50;

const finalizeOrExpireOne = async (order) => {
  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      // A successful payment for a still-Reserved order means payment
      // finalization was interrupted — recover to Paid (keep reserved stock).
      const successPayment = await Payment.findOne({
        order: order._id,
        status: PAYMENT_STATUS.SUCCESS,
      }).session(session);

      if (successPayment) {
        result = await Order.findOneAndUpdate(
          { _id: order._id, status: ORDER_STATUS.RESERVED },
          { $set: { status: ORDER_STATUS.PAID, paidAt: new Date() } },
          { new: true, session }
        );
        return; // stock stays converted to sold
      }

      // Normal path: expire the reservation...
      const expired = await Order.findOneAndUpdate(
        { _id: order._id, status: ORDER_STATUS.RESERVED },
        { $set: { status: ORDER_STATUS.EXPIRED } },
        { new: true, session }
      );
      if (!expired) return; // someone else already processed it

      // ...and release the reserved stock atomically in the same transaction
      for (const item of expired.items) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } }, { session });
      }
      result = expired;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const runReservationExpirySweep = async () => {
  const now = new Date();
  const candidates = await Order.find({
    status: ORDER_STATUS.RESERVED,
    reservationExpiresAt: { $ne: null, $lte: now },
  })
    .sort({ reservationExpiresAt: 1 })
    .limit(BATCH_SIZE);

  let processed = 0;
  for (const order of candidates) {
    const result = await finalizeOrExpireOne(order);
    if (result) processed += 1;
  }

  return { scanned: candidates.length, processed };
};

let timer = null;

const startReservationExpiryJob = (intervalMs = 30000) => {
  if (timer) return;
  timer = setInterval(() => {
    runReservationExpirySweep()
      .then(({ processed }) => {
        if (processed > 0) {
          console.log(`⏰ Reservation expiry sweep: ${processed} order(s) finalized`);
        }
      })
      .catch((err) => console.error('Reservation expiry sweep failed:', err.message));
  }, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  console.log(`⏰ Reservation expiry job started (every ${Math.round(intervalMs / 1000)}s)`);
};

const stopReservationExpiryJob = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

module.exports = { runReservationExpirySweep, startReservationExpiryJob, stopReservationExpiryJob };
