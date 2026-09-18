const { v4: uuidv4 } = require('uuid');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');

function buildCartItem(product, quantity) {
  return {
    productId: product._id,
    name: product.name,
    price: product.price,
    quantity,
    subtotal: Number(product.price) * Number(quantity),
  };
}

function ensureActiveCart(cart) {
  if (cart.status !== 'active') {
    throw Object.assign(new Error('This cart has already been submitted for checkout'), { statusCode: 409 });
  }
}

async function createCart(req, res) {
  try {
    const cart = await Cart.create({ cartId: uuidv4(), items: [], totalAmount: 0, status: 'active' });
    return sendSuccess(res, cart, 201);
  } catch (error) {
    return sendError(res, 500, 'Failed to create cart');
  }
}

async function addItemToCart(req, res) {
  try {
    const { cartId } = req.params;
    const { productId, quantity = 1 } = req.body;

    if (!productId) return sendError(res, 400, 'Product id is required');
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return sendError(res, 400, 'Quantity must be a positive integer');
    }

    const cart = await Cart.findOne({ cartId });
    if (!cart) return sendError(res, 404, 'Cart not found');
    ensureActiveCart(cart);

    const product = await Product.findById(productId);
    if (!product) return sendError(res, 404, 'Product not found');

    const existingItem = cart.items.find((item) => String(item.productId) === String(productId));
    const nextQuantity = existingItem ? existingItem.quantity + Number(quantity) : Number(quantity);

    if (existingItem) {
      existingItem.quantity = nextQuantity;
      existingItem.price = Number(product.price);
      existingItem.subtotal = Number(product.price) * nextQuantity;
    } else {
      cart.items.push(buildCartItem(product, Number(quantity)));
    }

    cart.totalAmount = cart.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    await cart.save();

    return sendSuccess(res, cart);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to add item to cart');
  }
}

async function updateCartItem(req, res) {
  try {
    const { cartId, productId } = req.params;
    const { quantity } = req.body;

    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return sendError(res, 400, 'Quantity must be a positive integer');
    }

    const cart = await Cart.findOne({ cartId });
    if (!cart) return sendError(res, 404, 'Cart not found');
    ensureActiveCart(cart);

    const item = cart.items.find((entry) => String(entry.productId) === String(productId));
    if (!item) return sendError(res, 404, 'Product not found in cart');

    const product = await Product.findById(productId);
    if (!product) return sendError(res, 404, 'Product not found');

    item.quantity = Number(quantity);
    item.price = Number(product.price);
    item.subtotal = Number(product.price) * Number(quantity);
    cart.totalAmount = cart.items.reduce((sum, entry) => sum + Number(entry.subtotal), 0);
    await cart.save();

    return sendSuccess(res, cart);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to update cart item');
  }
}

async function removeCartItem(req, res) {
  try {
    const { cartId, productId } = req.params;
    const cart = await Cart.findOne({ cartId });
    if (!cart) return sendError(res, 404, 'Cart not found');
    ensureActiveCart(cart);

    cart.items = cart.items.filter((entry) => String(entry.productId) !== String(productId));
    cart.totalAmount = cart.items.reduce((sum, entry) => sum + Number(entry.subtotal), 0);
    await cart.save();

    return sendSuccess(res, cart);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to remove item');
  }
}

async function getCart(req, res) {
  try {
    const { cartId } = req.params;
    const cart = await Cart.findOne({ cartId });
    if (!cart) return sendError(res, 404, 'Cart not found');

    return sendSuccess(res, cart);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch cart');
  }
}

async function deleteCart(req, res) {
  try {
    const { cartId } = req.params;
    const cart = await Cart.findOne({ cartId });
    if (!cart) return sendError(res, 404, 'Cart not found');
    ensureActiveCart(cart);

    await cart.deleteOne();

    return sendSuccess(res, { deleted: true, cartId });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to delete cart');
  }
}

module.exports = {
  createCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  getCart,
  deleteCart,
};
