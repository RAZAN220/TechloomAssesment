const { sendError } = require('../utils/apiResponse');

function notFoundHandler(req, res) {
  sendError(res, 404, 'Resource not found');
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)[0]?.message || 'Validation failed';
    return sendError(res, 400, message);
  }

  if (err.name === 'CastError') {
    return sendError(res, 400, 'Invalid resource identifier');
  }

  if (err.code === 11000) {
    return sendError(res, 409, 'Duplicate record detected');
  }

  if (err.statusCode) {
    return sendError(res, err.statusCode, err.message || 'Request failed');
  }

  return sendError(res, 500, 'Internal server error');
}

module.exports = { notFoundHandler, errorHandler };
