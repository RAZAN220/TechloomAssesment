/**
 * Baseline centralized error handling.
 * Extended with validation/domain error mapping in later phases.
 */

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;
  if (statusCode < 400 || statusCode > 599) statusCode = 500;

  let message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  let errors = Array.isArray(err.errors) && err.errors.length ? err.errors : undefined;

  // Mongoose schema validation failures -> 400 with field details
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Invalid ObjectId / cast failures -> 400
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
    errors = undefined;
  }

  // Duplicate unique key -> 409
  if (err && err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : null;
    message = field ? `Duplicate value for "${field}"` : 'Duplicate key error';
    errors = undefined;
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
