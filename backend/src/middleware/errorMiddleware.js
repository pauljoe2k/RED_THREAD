const AppError = require('../utils/AppError');

// ─── Error normalisers ────────────────────────────────────────────────────────

/**
 * Mongoose CastError → invalid ObjectId in URL params.
 * e.g. GET /api/nodes/not-an-id
 */
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: '${err.value}' is not a valid ID.`, 400);

/**
 * Mongoose duplicate key (code 11000).
 * e.g. registering with an already-taken email.
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(
    `'${value}' is already in use for field '${field}'. Please choose a different value.`,
    400
  );
};

/**
 * Mongoose schema-level ValidationError.
 */
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

/**
 * JWT bad signature / malformed token.
 * Raw message ("invalid signature") must NEVER reach the client.
 */
const handleJWTError = () =>
  new AppError('Invalid token — please log in again.', 401);

/**
 * JWT expired.
 */
const handleJWTExpiredError = () =>
  new AppError('Your session has expired — please log in again.', 401);

// ─── Normalise any error into an AppError ────────────────────────────────────

/**
 * Convert known third-party error types into operational AppErrors.
 * This runs in BOTH dev and prod so the client always gets a clean message.
 */
const normaliseError = (err) => {
  // Clone so we don't mutate the original
  let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
  error.message = err.message;

  if (error.name === 'CastError') return handleCastError(error);
  if (error.code === 11000) return handleDuplicateKeyError(error);
  if (error.name === 'ValidationError') return handleValidationError(error);
  if (error.name === 'JsonWebTokenError') return handleJWTError();
  if (error.name === 'TokenExpiredError') return handleJWTExpiredError();

  return error; // already an AppError or unknown programming error
};

// ─── Response format helpers ──────────────────────────────────────────────────

/**
 * Development: include stack trace for easier debugging.
 * Error is already normalised before this is called.
 */
const sendDevError = (err, res) => {
  console.error('\n❌ ERROR [dev]:', err.message, '\n', err.stack, '\n');
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    // Only include stack in dev — never in prod
    stack: err.stack,
  });
};

/**
 * Production: safe subset only.
 * Operational errors expose the message; unexpected errors show a generic fallback.
 */
const sendProdError = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown / programming error — don't leak internals
  console.error('❌ UNEXPECTED ERROR [prod]:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
};

// ─── Global error handler (must be last middleware in index.js) ───────────────

const globalErrorHandler = (err, _req, res, _next) => {
  // Normalise FIRST — applies in both dev and prod so clients always get
  // a clean, human-readable message regardless of NODE_ENV.
  const normalisedErr = normaliseError(err);
  normalisedErr.statusCode = normalisedErr.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendDevError(normalisedErr, res);
  } else {
    sendProdError(normalisedErr, res);
  }
};

module.exports = globalErrorHandler;
