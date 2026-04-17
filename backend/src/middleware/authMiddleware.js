const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * Protect middleware — verifies JWT.
 *
 * Token source priority:
 *  1. httpOnly cookie: `redthread_token`  (primary — set by backend on login)
 *  2. Authorization header: `Bearer <token>`  (fallback — for API clients / tooling)
 *
 * Attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, _res, next) => {
  let token;

  // 1. Cookie (httpOnly — not accessible via JS on the client)
  if (req.cookies && req.cookies.redthread_token) {
    token = req.cookies.redthread_token;
  }

  // 2. Authorization header fallback
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized — no token provided', 401));
  }

  // jwt.verify throws JsonWebTokenError / TokenExpiredError on failure;
  // those are caught by asyncHandler and handled by globalErrorHandler.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    return next(new AppError('Not authorized — user account no longer exists', 401));
  }

  req.user = user;
  next();
});

module.exports = { protect };
