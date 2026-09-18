/**
 * Payment controller — mock gateway endpoints.
 */
const paymentService = require('../services/paymentService');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Process a (simulated) payment for a checkout session
// @route   POST /api/payments/process
// @access  Private
const processPayment = async (req, res, next) => {
  try {
    const idempotencyKey =
      (req.headers['idempotency-key'] && String(req.headers['idempotency-key']).trim()) ||
      req.body.idempotencyKey ||
      null;

    const { payment, order, replayed } = await paymentService.processPayment({
      userId: req.user._id,
      checkoutSessionId: req.body.checkoutSessionId,
      simulate: req.body.simulate,
      amount: req.body.amount,
      idempotencyKey,
    });

    return sendSuccess(res, {
      status: replayed ? 200 : 201,
      message: replayed ? 'Payment replay (idempotent)' : `Payment ${payment.status}`,
      data: {
        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          transactionReference: payment.transactionReference,
          failureReason: payment.failureReason,
          createdAt: payment.createdAt,
        },
        order: {
          id: order._id,
          status: order.status,
          total: order.total,
          checkoutSessionId: order.checkoutSessionId,
        },
        replayed,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// @desc    Get a payment by id (owner or admin)
// @route   GET /api/payments/:paymentId
// @access  Private
const getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentView(req.user, req.params.paymentId);
    return sendSuccess(res, { data: { payment } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { processPayment, getPayment };
