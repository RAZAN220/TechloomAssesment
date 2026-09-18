/**
 * Auth controller — register, login, current profile.
 */
const User = require('../models/User');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const generateToken = require('../utils/generateToken');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const user = await User.create({ name, email, password });

    return sendSuccess(res, {
      status: 201,
      message: 'Registration successful',
      data: {
        user: sanitizeUser(user),
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    if (err && err.code === 11000 && err.keyValue && err.keyValue.email) {
      return next(ApiError.conflict('An account with this email already exists'));
    }
    return next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Same generic message for unknown email / wrong password (no user enumeration)
    if (!user || !(await user.matchPassword(password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    return sendSuccess(res, {
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    return next(err);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = (req, res) =>
  sendSuccess(res, { data: { user: sanitizeUser(req.user) } });

module.exports = { registerUser, loginUser, getMe };
