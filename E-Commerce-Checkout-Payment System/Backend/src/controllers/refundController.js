/**
 * Refund controller — simulated refunds (idempotent).
 */
const refundService = require('../services/refundService');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Create a (simulated) refund for an order
// @route   POST /api/refunds
// @access  Private
const createRefund = async (req, res, next) => {
  try {
    const idempotencyKey =
      (req.headers['idempotency-key'] && String(req.headers['idempotency-key']).trim()) ||
      req.body.idempotencyKey ||
      null;

    const { refund, replayed } = await refundService.createRefund({
      userId: req.user._id,
      orderId: req.body.orderId,
      idempotencyKey,
      reason: req.body.reason,
    });

    return sendSuccess(res, {
      status: replayed ? 200 : 201,
      message: replayed ? 'Refund replay (idempotent)' : 'Refund processed successfully',
      data: {
        refund: {
          id: refund._id,
          order: refund.order,
          payment: refund.payment,
          amount: refund.amount,
          status: refund.status,
          refundReference: refund.refundReference,
          reason: refund.reason,
          createdAt: refund.createdAt,
          processedAt: refund.processedAt,
        },
        replayed,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { createRefund };
