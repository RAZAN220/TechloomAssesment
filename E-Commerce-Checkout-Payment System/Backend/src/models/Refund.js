/**
 * Refund model — simulated refunds.
 * - idempotencyKey: unique — one refund per key; duplicate refunds are rejected
 * - payment: the successful charge being refunded
 */
const mongoose = require('mongoose');
const { REFUND_STATUS } = require('../utils/constants');

const refundSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true, // duplicate refund prevention
    },
    amount: { type: Number, required: true, min: 0 }, // cents
    status: {
      type: String,
      enum: Object.values(REFUND_STATUS),
      default: REFUND_STATUS.PENDING,
      index: true,
    },
    refundReference: {
      type: String,
      unique: true,
      sparse: true, // absent until the gateway resolves the refund
    },
    reason: { type: String, default: null, maxlength: 300 },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Refund', refundSchema);
