/**
 * Uniform API response envelope + typed operational error.
 * Every endpoint responds with { success, message?, data? } or { success:false, message, errors? }.
 */

class ApiError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Not authorized, token failed') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static gone(message) {
    return new ApiError(410, message);
  }

  static unprocessable(message, errors) {
    return new ApiError(422, message, errors);
  }
}

const sendSuccess = (res, { status = 200, message, data } = {}) =>
  res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });

const sendError = (res, statusCode, message, errors) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });

module.exports = { ApiError, sendSuccess, sendError };
