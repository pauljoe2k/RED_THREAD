const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Reads express-validator's result for this request.
 * On failure, collects every error message and throws a
 * single 400 AppError that the global handler will format.
 *
 * Usage: place after your body() / param() chains in a route:
 *   router.post('/', [body('title').notEmpty()], validate, handler)
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const messages = errors.array().map((e) => e.msg);

  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Validation errors:', errors.array());
  }

  return next(new AppError(messages.join('. '), 400));
};

module.exports = validate;
