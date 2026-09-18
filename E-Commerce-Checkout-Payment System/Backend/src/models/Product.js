/**
 * Product model — catalog items.
 * All monetary values are integers in minor units (cents), never floats.
 */
const mongoose = require('mongoose');

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer amount of minor units (cents)',
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name must be at most 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [60, 'Category must be at most 60 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least 1 cent'],
      validate: integerValidator,
    },
    image: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Image URL must be at most 500 characters'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      validate: integerValidator,
    },
  },
  { timestamps: true }
);

// Search + filter + sort support
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ stock: 1 });

module.exports = mongoose.model('Product', productSchema);
