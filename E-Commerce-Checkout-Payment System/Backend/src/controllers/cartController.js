/**
 * Cart controller — all routes are user-scoped (req.user._id).
 */
const cartService = require('../services/cartService');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Get current user's cart (with live validation flags)
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCartView(req.user._id);
    return sendSuccess(res, { data: { cart } });
  } catch (err) {
    return next(err);
  }
};

// @desc    Add product to cart
// @route   POST /api/cart/items
// @access  Private
const addItem = async (req, res, next) => {
  try {
    const cart = await cartService.addItem(req.user._id, req.body.productId, req.body.qty);
    return sendSuccess(res, { message: 'Item added to cart', data: { cart } });
  } catch (err) {
    return next(err);
  }
};

// @desc    Update item quantity (qty 0 removes the item)
// @route   PUT /api/cart/items/:productId
// @access  Private
const updateItem = async (req, res, next) => {
  try {
    const cart = await cartService.updateItem(req.user._id, req.params.productId, req.body.qty);
    return sendSuccess(res, { message: 'Cart updated', data: { cart } });
  } catch (err) {
    return next(err);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private
const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeItem(req.user._id, req.params.productId);
    return sendSuccess(res, { message: 'Item removed from cart', data: { cart } });
  } catch (err) {
    return next(err);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user._id);
    return sendSuccess(res, { message: 'Cart cleared', data: { cart } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
