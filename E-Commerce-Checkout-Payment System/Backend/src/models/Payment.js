/**
 * Payment model — mock gateway charges.
 * - idempotencyKey: unique — the same key can never create two charges
 * - checkoutSessionId: indexed — duplicate-payment detection per session
 * - transactionReference: unique gateway reference for every charge attempt
 */
const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../utils/constants');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    checkoutSessionId: { type: String, required: true, index: true },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true, // duplicate payment prevention
    },
    amount: { type: Number, required: true, min: 0 }, // cents — validated against order total
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    transactionReference: {
      type: String,
      unique: true,
      sparse: true, // absent while Pending; set once when the gateway resolves
    },
    failureReason: { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
