/**
 * Payment routes: /api/payments
 */
const express = require('express');
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { processPayment, getPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

// Payment attempts mutate financial state — strict rate limit (tunable via env)
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX || '15', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment attempts. Please slow down.' },
});

// @route POST /api/payments/process
router.post(
  '/process',
  protect,
  paymentLimiter,
  validate([
    body('checkoutSessionId')
      .trim()
      .isLength({ min: 8, max: 64 })
      .withMessage('A valid checkoutSessionId is required'),
    body('simulate')
      .isIn(['success', 'failure', 'timeout'])
      .withMessage('simulate must be one of: success, failure, timeout'),
    body('amount')
      .optional()
      .isInt({ min: 0 })
      .withMessage('amount must be a non-negative integer (cents)'),
    body('idempotencyKey')
      .optional()
      .trim()
      .isLength({ min: 8, max: 128 })
      .withMessage('idempotencyKey must be 8-128 characters'),
  ]),
  processPayment
);

// @route GET /api/payments/:paymentId
router.get(
  '/:paymentId',
  protect,
  validate([param('paymentId').isMongoId().withMessage('Invalid payment id')]),
  getPayment
);

module.exports = router;
