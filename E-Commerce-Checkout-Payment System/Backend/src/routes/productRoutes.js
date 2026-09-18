/**
 * Product routes: /api/products
 * Discovery is public; management is admin-only.
 */
const express = require('express');
const { body, param, query } = require('express-validator');

const {
  listProducts,
  getCategories,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

const productIdParam = param('id').isMongoId().withMessage('Invalid product id');

// @route GET /api/products — public discovery
router.get(
  '/',
  validate([
    query('search').optional().trim().isLength({ max: 120 }).withMessage('Search is too long'),
    query('category').optional().trim().isLength({ max: 60 }).withMessage('Category is too long'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0, max: 1000000 })
      .withMessage('minPrice must be a number between 0 and 1000000'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0, max: 1000000 })
      .withMessage('maxPrice must be a number between 0 and 1000000'),
    query('inStock')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('inStock must be "true" or "false"'),
    query('sortBy')
      .optional()
      .isIn(['newest', 'price_asc', 'price_desc'])
      .withMessage('sortBy must be newest, price_asc or price_desc'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ]),
  listProducts
);

// @route GET /api/products/categories — must be declared before /:id
router.get('/categories', getCategories);

// @route GET /api/products/:id
router.get('/:id', validate([productIdParam]), getProduct);

// @route POST /api/products — admin
router.post(
  '/',
  protect,
  adminOnly,
  validate([
    body('name')
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('Name must be 2-120 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be 10-2000 characters'),
    body('category')
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage('Category must be 2-60 characters'),
    body('price')
      .isFloat({ min: 0.01, max: 1000000 })
      .withMessage('Price must be between 0.01 and 1000000'),
    body('image')
      .optional({ values: 'falsy' })
      .trim()
      .isURL()
      .withMessage('Image must be a valid URL'),
    body('stock')
      .isInt({ min: 0, max: 1000000 })
      .withMessage('Stock must be a non-negative integer'),
  ]),
  createProduct
);

// @route PUT /api/products/:id — admin (partial update)
router.put(
  '/:id',
  protect,
  adminOnly,
  validate([
    productIdParam,
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('Name must be 2-120 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be 10-2000 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage('Category must be 2-60 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0.01, max: 1000000 })
      .withMessage('Price must be between 0.01 and 1000000'),
    body('image')
      .optional({ values: 'falsy' })
      .trim()
      .isURL()
      .withMessage('Image must be a valid URL'),
    body('stock')
      .optional()
      .isInt({ min: 0, max: 1000000 })
      .withMessage('Stock must be a non-negative integer'),
  ]),
  updateProduct
);

// @route DELETE /api/products/:id — admin
router.delete('/:id', protect, adminOnly, validate([productIdParam]), deleteProduct);

module.exports = router;
