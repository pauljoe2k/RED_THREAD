/**
 * Custom operational error with HTTP status code.
 * Distinguishes known errors (validation, 404, 403) from
 * unexpected programming errors so the error handler can
 * respond appropriately in production vs. development.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {number} statusCode - HTTP status code to send
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark as a known, safe-to-expose error

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
