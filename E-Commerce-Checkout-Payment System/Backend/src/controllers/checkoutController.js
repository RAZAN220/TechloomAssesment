/**
 * Checkout controller — reservation-backed checkout sessions.
 */
const checkoutService = require('../services/checkoutService');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Create a checkout session (reserve stock for 5 minutes)
// @route   POST /api/checkout
// @access  Private
// Idempotency: send the same "Idempotency-Key" header (or body key) to retry
// safely — the same key always returns the same session, never a second order.
const checkout = async (req, res, next) => {
  try {
    const idempotencyKey =
      (req.headers['idempotency-key'] && String(req.headers['idempotency-key']).trim()) ||
      (req.body && req.body.idempotencyKey) ||
      null;

    const { order, replayed } = await checkoutService.checkoutCart(req.user._id, idempotencyKey);

    return sendSuccess(res, {
      status: replayed ? 200 : 201,
      message: replayed
        ? 'Checkout session already exists (idempotent replay)'
        : 'Checkout successful — stock reserved',
      data: {
        checkoutSessionId: order.checkoutSessionId,
        orderId: order._id,
        status: order.status,
        items: order.items,
        subtotal: order.subtotal,
        total: order.total,
        reservationExpiresAt: order.reservationExpiresAt,
        replayed,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// @desc    Get checkout session state (countdown, payment status)
// @route   GET /api/checkout/:sessionId
// @access  Private (owner only)
const getSession = async (req, res, next) => {
  try {
    const session = await checkoutService.getSessionView(req.user._id, req.params.sessionId);
    return sendSuccess(res, { data: { session } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { checkout, getSession };
