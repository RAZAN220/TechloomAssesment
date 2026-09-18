/**
 * Validation middleware — runs express-validator chains and normalizes failures
 * into the standard error envelope. Chains are declared per-route; a shared
 * library of common chains is added in the hardening phase.
 */
const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/apiResponse');

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));

  return next(ApiError.badRequest('Validation failed', details));
};

module.exports = { validate };
