/**
 * Wraps an async Express route handler so that any rejected
 * promise is automatically forwarded to next(err) — eliminating
 * every try/catch block in controllers.
 *
 * @param {Function} fn - async (req, res, next) => ...
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
