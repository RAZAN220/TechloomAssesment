/**
 * Checkout routes: /api/checkout
 */
const express = require('express');
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { checkout, getSession } = require('../controllers/checkoutController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

// Checkout mutates inventory — rate limit it (tunable via env)
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.CHECKOUT_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many checkout attempts. Please slow down.' },
});

// @route POST /api/checkout
router.post(
  '/',
  protect,
  checkoutLimiter,
  validate([
    body('idempotencyKey')
      .optional()
      .trim()
      .isLength({ min: 8, max: 128 })
      .withMessage('idempotencyKey must be 8-128 characters'),
  ]),
  checkout
);

// @route GET /api/checkout/:sessionId
router.get(
  '/:sessionId',
  protect,
  validate([
    param('sessionId')
      .trim()
      .isLength({ min: 8, max: 64 })
      .withMessage('Invalid checkout session id'),
  ]),
  getSession
);

module.exports = router;
