/**
 * Cart model — one cart per user.
 * Items keep name/price snapshots for display; prices and availability are
 * ALWAYS revalidated server-side at checkout time (frontend is never trusted).
 */
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // cents snapshot for display
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one cart per user
      index: true,
    },
    items: { type: [cartItemSchema], default: [] },
    total: { type: Number, default: 0, min: 0 }, // sum(price * qty) in cents
  },
  { timestamps: true }
);

cartSchema.methods.recalculateTotal = function recalculateTotal() {
  this.total = this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return this.total;
};

module.exports = mongoose.model('Cart', cartSchema);
