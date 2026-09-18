const { processPayment } = require('../services/paymentService');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { isValidObjectId } = require('../utils/validators');

async function processOrderPayment(req, res) {
  try {
    const { orderId, outcome } = req.body;

    if (!orderId || !isValidObjectId(orderId)) return sendError(res, 400, 'A valid order id is required');
    if (!['success', 'failure', 'timeout'].includes(outcome)) return sendError(res, 400, 'Invalid payment outcome');

    const result = await processPayment({ orderId, outcome });
    if (result.rejected) return sendError(res, 409, result.message);
    return sendSuccess(res, result.order);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Payment processing failed');
  }
}

async function getPaymentStatus(req, res) {
  try {
    const { orderId } = req.params;
    if (!isValidObjectId(orderId)) return sendError(res, 400, 'Invalid order id');
    const order = await Order.findById(orderId);
    if (!order) return sendError(res, 404, 'Order not found');

    return sendSuccess(res, {
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch payment status');
  }
}

module.exports = { processOrderPayment, getPaymentStatus };
