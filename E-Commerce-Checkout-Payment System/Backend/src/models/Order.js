/**
 * Order model.
 * - items: immutable snapshot of product id, name, unit price (cents) and qty
 * - checkoutSessionId: unique — guarantees one order per checkout session
 * - reservationExpiresAt: 5 minutes from checkout; drives the expiry job
 * - status transitions are enforced against ORDER_STATUS_TRANSITIONS
 */
const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../utils/constants');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // immutable unit price snapshot (cents)
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    checkoutSessionId: {
      type: String,
      required: true,
      unique: true, // one order per checkout session
    },
    checkoutIdempotencyKey: {
      type: String,
      // NOTE: no default on purpose — the field must be ABSENT (not null) so
      // the sparse unique index only covers orders that carry an idempotency
      // key (null values would still be indexed and collide).
      unique: true,
      sparse: true, // duplicate checkout prevention
    },
    items: { type: [orderItemSchema], validate: (v) => Array.isArray(v) && v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 }, // cents
    total: { type: Number, required: true, min: 0 }, // cents
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    reservationExpiresAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Order history listing (newest first per user)
orderSchema.index({ user: 1, createdAt: -1 });

// Reservation expiry worker: find expired reservations efficiently
orderSchema.index({ status: 1, reservationExpiresAt: 1 });

module.exports = mongoose.model('Order', orderSchema);
