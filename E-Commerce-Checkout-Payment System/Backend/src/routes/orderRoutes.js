/**
 * Order routes: /api/orders
 */
const express = require('express');
const { body, param, query } = require('express-validator');

const { listOrders, getOrder, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

const orderIdParam = param('id').isMongoId().withMessage('Invalid order id');

// @route GET /api/orders
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('limit must be between 1 and 50'),
  ]),
  listOrders
);

// @route GET /api/orders/:id
router.get('/:id', validate([orderIdParam]), getOrder);

// @route POST /api/orders/:id/cancel
router.post(
  '/:id/cancel',
  validate([
    orderIdParam,
    body('reason').optional().trim().isLength({ max: 300 }).withMessage('Reason is too long'),
    body('idempotencyKey')
      .optional()
      .trim()
      .isLength({ min: 8, max: 128 })
      .withMessage('idempotencyKey must be 8-128 characters'),
  ]),
  cancelOrder
);

module.exports = router;
