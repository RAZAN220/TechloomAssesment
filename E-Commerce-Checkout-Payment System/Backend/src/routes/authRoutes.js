/**
 * Auth routes: /api/auth
 */
const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

// Rate limiting on sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

// @route POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validate([
    body('name')
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage('Name must be 2-60 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6, max: 72 })
      .withMessage('Password must be at least 6 characters'),
  ]),
  registerUser
);

// @route POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate([
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  loginUser
);

// @route GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
