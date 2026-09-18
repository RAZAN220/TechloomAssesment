/**
 * Order controller — history, details, cancellation.
 */
const orderService = require('../services/orderService');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Current user's order history
// @route   GET /api/orders
// @access  Private
const listOrders = async (req, res, next) => {
  try {
    const result = await orderService.listOrders(req.user._id, req.query);
    const orders = result.orders.map((o) => ({
      id: o._id,
      checkoutSessionId: o.checkoutSessionId,
      items: o.items,
      subtotal: o.subtotal,
      total: o.total,
      status: o.status,
      reservationExpiresAt: o.reservationExpiresAt,
      createdAt: o.createdAt,
      canCancel: orderService.canCancel(o),
    }));
    return sendSuccess(res, { data: { orders, pagination: result.pagination } });
  } catch (err) {
    return next(err);
  }
};

// @desc    Order details incl. payments + refunds
// @route   GET /api/orders/:id
// @access  Private (owner or admin)
const getOrder = async (req, res, next) => {
  try {
    const { order, payments, refunds } = await orderService.getOrderDetail(
      req.user,
      req.params.id
    );
    return sendSuccess(res, {
      data: {
        order: { ...order, canCancel: orderService.canCancel(order) },
        payments,
        refunds,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// @desc    Cancel an eligible order (Reserved -> release stock; Paid -> refund)
// @route   POST /api/orders/:id/cancel
// @access  Private (owner only)
const cancelOrder = async (req, res, next) => {
  try {
    const idempotencyKey =
      (req.headers['idempotency-key'] && String(req.headers['idempotency-key']).trim()) ||
      (req.body && req.body.idempotencyKey) ||
      null;

    const { order, refund } = await orderService.cancelOrder(req.user._id, req.params.id, {
      reason: req.body && req.body.reason,
      idempotencyKey,
    });

    return sendSuccess(res, {
      message:
        order.status === 'Refunded'
          ? 'Order cancelled and refunded'
          : 'Order cancelled, reserved stock released',
      data: {
        order: { id: order._id, status: order.status, cancelledAt: order.cancelledAt },
        refund: refund
          ? {
              id: refund._id,
              status: refund.status,
              amount: refund.amount,
              refundReference: refund.refundReference,
            }
          : null,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { listOrders, getOrder, cancelOrder };
