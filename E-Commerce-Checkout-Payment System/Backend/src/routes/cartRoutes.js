/**
 * Cart routes: /api/cart (all private, user-scoped)
 */
const express = require('express');
const { body, param } = require('express-validator');

const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

const productIdParam = param('productId').isMongoId().withMessage('Invalid product id');

router.use(protect);

// @route GET /api/cart
router.get('/', getCart);

// @route POST /api/cart/items
router.post(
  '/items',
  validate([
    body('productId').isMongoId().withMessage('A valid productId is required'),
    body('qty')
      .optional()
      .isInt({ min: 1, max: 99 })
      .withMessage('qty must be an integer between 1 and 99'),
  ]),
  addItem
);

// @route PUT /api/cart/items/:productId
router.put(
  '/items/:productId',
  validate([
    productIdParam,
    body('qty')
      .isInt({ min: 0, max: 99 })
      .withMessage('qty must be an integer between 0 and 99 (0 removes the item)'),
  ]),
  updateItem
);

// @route DELETE /api/cart/items/:productId
router.delete('/items/:productId', validate([productIdParam]), removeItem);

// @route DELETE /api/cart
router.delete('/', clearCart);

module.exports = router;
