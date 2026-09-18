/**
 * Refund routes: /api/refunds
 */
const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { createRefund } = require('../controllers/refundController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

// Financial mutation — rate limit (tunable via env)
const refundLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.REFUND_RATE_LIMIT_MAX || '15', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many refund attempts. Please slow down.' },
});

// @route POST /api/refunds
router.post(
  '/',
  protect,
  refundLimiter,
  validate([
    body('orderId').isMongoId().withMessage('A valid orderId is required'),
    body('reason').optional().trim().isLength({ max: 300 }).withMessage('Reason is too long'),
    body('idempotencyKey')
      .optional()
      .trim()
      .isLength({ min: 8, max: 128 })
      .withMessage('idempotencyKey must be 8-128 characters'),
  ]),
  createRefund
);

module.exports = router;
