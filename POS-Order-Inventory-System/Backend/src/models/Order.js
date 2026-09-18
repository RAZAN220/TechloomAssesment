const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    // One cart may create only one order. This is a final database-level guard
    // against duplicate checkout submissions racing each other.
    cartId: { type: String, required: true, unique: true, index: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Reserved', 'Paid', 'Failed', 'Expired', 'Cancelled'],
      default: 'Pending',
    },
    reservationExpiresAt: { type: Date },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'timeout'],
      default: 'pending',
    },
    paymentReference: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
