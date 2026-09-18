/**
 * Authentication middleware.
 * - protect: verifies Bearer JWT and attaches the user document to req.user
 * - adminOnly: role gate for admin-only endpoints
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('../utils/apiResponse');

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthorized('Not authorized, no token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('Not authorized, user no longer exists');
    }

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Not authorized, token is invalid or expired'));
    }
    return next(err);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return next(ApiError.forbidden('Admin access required'));
};

module.exports = { protect, adminOnly };
