const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// ─── Cookie config ─────────────────────────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,                         // inaccessible to JS (XSS protection)
  secure:   IS_PROD,                      // HTTPS only in production
  sameSite: IS_PROD ? 'none' : 'lax',    // 'none' needed for cross-origin Vercel→Render
  maxAge:   7 * 24 * 60 * 60 * 1000,     // 7 days in ms
};

// ─── JWT generator ─────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Helper: set auth cookie + return user payload ────────────────────────────
const sendAuthResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Set token in httpOnly cookie — browser stores and sends it automatically
  res.cookie('redthread_token', token, COOKIE_OPTIONS);

  // Return user info in body (NO token in body — it lives in the cookie only)
  res.status(statusCode).json({
    success: true,
    data: {
      _id:      user._id,
      username: user.username,
      email:    user.email,
    },
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Username';
    return next(new AppError(`${field} is already taken`, 400));
  }

  const user = await User.create({ username, email, password });
  sendAuthResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Explicitly select password (schema has select: false)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    // Log auth failures for monitoring — never expose which field failed
    console.warn(`⚠️  Auth failure: IP=${req.ip} email=${email}`);
    return next(new AppError('Invalid email or password', 401));
  }

  sendAuthResponse(user, 200, res);
});

// @desc    Logout — clear httpOnly cookie
// @route   POST /api/auth/logout
// @access  Public (no auth required to clear the cookie)
const logout = (_req, res) => {
  // Options must exactly mirror COOKIE_OPTIONS (minus maxAge) so the
  // browser recognises this as the same cookie and removes it.
  res.clearCookie('redthread_token', {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      _id:      req.user._id,
      username: req.user.username,
      email:    req.user.email,
    },
  });
});

module.exports = { register, login, logout, getMe };
