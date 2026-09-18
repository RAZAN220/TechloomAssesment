const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    cartId: { type: String, required: true, unique: true, index: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, default: 'active', enum: ['active', 'checking_out', 'checked_out'] },
    checkoutOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true, optimisticConcurrency: true }
);

module.exports = mongoose.model('Cart', cartSchema);
