const { body, param } = require('express-validator');

const THREAD_TYPES = ['influence', 'similarity', 'cause'];

// ─── Auth ─────────────────────────────────────────────────────────────────────

const registerRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .isLength({ max: 30 }).withMessage('Username must not exceed 30 characters')
    .isAlphanumeric('en-US', { ignore: '_-' })
    .withMessage('Username may only contain letters, numbers, underscores and hyphens'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .isLength({ max: 128 }).withMessage('Password must not exceed 128 characters'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 128 }).withMessage('Password must not exceed 128 characters'),
];

// ─── ConspiracyNode ───────────────────────────────────────────────────────────
// NOTE: Do NOT use .escape() here.
// .escape() HTML-encodes characters which causes double-encoding when React
// renders them (e.g. "& " becomes "&amp;" stored in DB → displayed as literal
// "&amp;" text in the browser). React already handles XSS at render time by
// treating all JSX text as plain text nodes, not HTML. The NoSQL sanitizer +
// Mongoose schema trimming + length limits are sufficient for the backend.

const createNodeRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 120 }).withMessage('Title must not exceed 120 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
  body('tags')
    .optional()
    .isArray({ max: 20 }).withMessage('Tags must be an array with at most 20 items')
    .custom((tags) => {
      for (const t of tags) {
        if (typeof t !== 'string') throw new Error('Each tag must be a string');
        if (t.length > 50) throw new Error('Each tag must be 50 characters or fewer');
      }
      return true;
    }),
  // Reject unknown top-level body fields
  body().custom((body) => {
    const allowed = new Set(['title', 'description', 'tags']);
    const unknown = Object.keys(body).filter((k) => !allowed.has(k));
    if (unknown.length) throw new Error(`Unknown field(s): ${unknown.join(', ')}`);
    return true;
  }),
];

const updateNodeRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title must not be empty')
    .isLength({ max: 120 }).withMessage('Title must not exceed 120 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty().withMessage('Description must not be empty')
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
  body('tags')
    .optional()
    .isArray({ max: 20 }).withMessage('Tags must be an array with at most 20 items')
    .custom((tags) => {
      for (const t of tags) {
        if (typeof t !== 'string') throw new Error('Each tag must be a string');
        if (t.length > 50) throw new Error('Each tag must be 50 characters or fewer');
      }
      return true;
    }),
  body().custom((body) => {
    const allowed = new Set(['title', 'description', 'tags']);
    const unknown = Object.keys(body).filter((k) => !allowed.has(k));
    if (unknown.length) throw new Error(`Unknown field(s): ${unknown.join(', ')}`);
    return true;
  }),
];

// ─── RedThread ────────────────────────────────────────────────────────────────

const createThreadRules = [
  body('fromNode')
    .notEmpty().withMessage('fromNode is required')
    .isMongoId().withMessage('fromNode must be a valid MongoDB ObjectId'),
  body('toNode')
    .notEmpty().withMessage('toNode is required')
    .isMongoId().withMessage('toNode must be a valid MongoDB ObjectId'),
  body('type')
    .notEmpty().withMessage('Thread type is required')
    .isIn(THREAD_TYPES).withMessage(`Type must be one of: ${THREAD_TYPES.join(', ')}`),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters')
    .trim(),
  body().custom((body) => {
    const allowed = new Set(['fromNode', 'toNode', 'type', 'description']);
    const unknown = Object.keys(body).filter((k) => !allowed.has(k));
    if (unknown.length) throw new Error(`Unknown field(s): ${unknown.join(', ')}`);
    return true;
  }),
];

const updateThreadRules = [
  body('type')
    .optional()
    .isIn(THREAD_TYPES).withMessage(`Type must be one of: ${THREAD_TYPES.join(', ')}`),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters')
    .trim(),
  body().custom((body) => {
    const allowed = new Set(['type', 'description']);
    const unknown = Object.keys(body).filter((k) => !allowed.has(k));
    if (unknown.length) throw new Error(`Unknown field(s): ${unknown.join(', ')}`);
    return true;
  }),
];

// ─── Param validators ─────────────────────────────────────────────────────────

const mongoIdParam = (paramName) => [
  param(paramName)
    .isMongoId().withMessage(`${paramName} must be a valid MongoDB ObjectId`),
];

module.exports = {
  registerRules,
  loginRules,
  createNodeRules,
  updateNodeRules,
  createThreadRules,
  updateThreadRules,
  mongoIdParam,
};
