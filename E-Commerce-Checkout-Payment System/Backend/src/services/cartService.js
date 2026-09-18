/**
 * Cart service — per-user cart with live product validation.
 * Stored item name/price are display snapshots; prices, stock and existence
 * are re-checked live on every read and strictly revalidated at checkout.
 */
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { ApiError } = require('../utils/apiResponse');
const { CART_LIMITS } = require('../utils/constants');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], total: 0 });
  }
  return cart;
};

/**
 * Builds the API view of a cart, enriching every item with live product state:
 * existence, current price, price drift and stock availability.
 */
const buildCartView = async (cart) => {
  const ids = cart.items.map((item) => item.product);
  const products = ids.length
    ? await Product.find({ _id: { $in: ids } }).select('name price stock').lean()
    : [];
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const items = cart.items.map((item) => {
    const product = productMap.get(String(item.product));
    return {
      product: item.product,
      name: item.name,
      price: item.price, // snapshot captured when added (cents)
      qty: item.qty,
      lineTotal: item.price * item.qty,
      live: {
        exists: Boolean(product),
        currentPrice: product ? product.price : null,
        priceChanged: Boolean(product) && product.price !== item.price,
        availableStock: product ? product.stock : 0,
        inStock: Boolean(product) && product.stock > 0,
        qtyExceedsStock: Boolean(product) && item.qty > product.stock,
      },
    };
  });

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const hasIssues = items.some(
    (item) =>
      !item.live.exists || !item.live.inStock || item.live.qtyExceedsStock || item.live.priceChanged
  );

  return { items, total: cart.total, itemCount, hasIssues };
};

const getCartView = async (userId) => {
  const cart = await getOrCreateCart(userId);
  return buildCartView(cart);
};

const assertValidQty = (qty, { allowZero = false } = {}) => {
  const parsed = parseInt(qty, 10);
  const min = allowZero ? 0 : 1;
  if (!Number.isInteger(parsed) || parsed < min || parsed > CART_LIMITS.MAX_QTY_PER_ITEM) {
    throw ApiError.badRequest(
      `Quantity must be an integer between ${min} and ${CART_LIMITS.MAX_QTY_PER_ITEM}`
    );
  }
  return parsed;
};

const addItem = async (userId, productId, qty = 1) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw ApiError.badRequest('Invalid product id');
  }
  const quantity = assertValidQty(qty);

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  if (product.stock < 1) {
    throw ApiError.unprocessable(`"${product.name}" is out of stock`);
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => String(item.product) === String(product._id));

  if (existing) {
    const merged = existing.qty + quantity;
    if (merged > product.stock) {
      throw ApiError.unprocessable(
        `Only ${product.stock} unit(s) of "${product.name}" available in stock`
      );
    }
    if (merged > CART_LIMITS.MAX_QTY_PER_ITEM) {
      throw ApiError.badRequest(
        `Quantity cannot exceed ${CART_LIMITS.MAX_QTY_PER_ITEM} per item`
      );
    }
    existing.qty = merged;
    existing.name = product.name;
    existing.price = product.price; // refresh snapshot
  } else {
    if (quantity > product.stock) {
      throw ApiError.unprocessable(
        `Only ${product.stock} unit(s) of "${product.name}" available in stock`
      );
    }
    if (cart.items.length >= CART_LIMITS.MAX_DISTINCT_ITEMS) {
      throw ApiError.badRequest(
        `Cart cannot contain more than ${CART_LIMITS.MAX_DISTINCT_ITEMS} distinct items`
      );
    }
    cart.items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      qty: quantity,
    });
  }

  cart.recalculateTotal();
  await cart.save();
  return getCartView(userId);
};

const updateItem = async (userId, productId, qty) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw ApiError.badRequest('Invalid product id');
  }
  const quantity = assertValidQty(qty, { allowZero: true });

  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => String(i.product) === String(productId));
  if (!item) {
    throw ApiError.notFound('Item not found in cart');
  }

  if (quantity === 0) {
    cart.items.pull(item);
  } else {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.unprocessable('Product is no longer available');
    }
    if (quantity > product.stock) {
      throw ApiError.unprocessable(
        `Only ${product.stock} unit(s) of "${product.name}" available in stock`
      );
    }
    item.qty = quantity;
    item.name = product.name;
    item.price = product.price; // refresh snapshot
  }

  cart.recalculateTotal();
  await cart.save();
  return getCartView(userId);
};

const removeItem = async (userId, productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw ApiError.badRequest('Invalid product id');
  }

  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => String(i.product) === String(productId));
  if (!item) {
    throw ApiError.notFound('Item not found in cart');
  }

  cart.items.pull(item);
  cart.recalculateTotal();
  await cart.save();
  return getCartView(userId);
};

const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.total = 0;
  await cart.save();
  return getCartView(userId);
};

module.exports = {
  getOrCreateCart,
  getCartView,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
