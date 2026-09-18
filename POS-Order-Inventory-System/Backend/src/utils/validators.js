const mongoose = require('mongoose');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function validateProductPayload(data) {
  if (!data || typeof data !== 'object') {
    return 'Invalid product payload';
  }

  if (!data.name || !String(data.name).trim()) {
    return 'Product name cannot be empty';
  }

  if (data.price === undefined || data.price === null || Number(data.price) < 0) {
    return 'Price cannot be negative';
  }

  if (data.stock === undefined || data.stock === null || Number(data.stock) < 0) {
    return 'Stock cannot be negative';
  }

  if (!Number.isInteger(Number(data.stock))) {
    return 'Stock must be an integer';
  }

  return null;
}

module.exports = { isValidObjectId, validateProductPayload };
