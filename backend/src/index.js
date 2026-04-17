require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser  = require('cookie-parser');
const mongoose   = require('mongoose');

const connectDB          = require('./config/db');
const globalErrorHandler = require('./middleware/errorMiddleware');
const AppError           = require('./utils/AppError');

const authRoutes   = require('./routes/authRoutes');
const nodeRoutes   = require('./routes/nodeRoutes');
const threadRoutes = require('./routes/threadRoutes');

// ─── Environment validation ───────────────────────────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const IS_PROD = process.env.NODE_ENV === 'production';
const log = IS_PROD ? () => {} : console.log;

// ─── Mongoose global config ───────────────────────────────────────────────────
// strictQuery: true — unknown query filter fields are silently ignored
// (already the default in Mongoose 7+, explicit here for clarity)
mongoose.set('strictQuery', true);

// ─── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

// ─── CORS (MUST be before Helmet and all other middleware) ───────────────────
// CORS must run first so that preflight OPTIONS requests receive the correct
// Access-Control-Allow-Origin header before Helmet or any other middleware
// can block or alter the response.
//
// CLIENT_ORIGIN is a comma-separated list of production frontend URLs
// e.g. "https://red-thread-kappa.vercel.app"
// localhost:3000 is always included for local development.
const allowedOrigins = [
  'http://localhost:3000',
  ...( process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
    : []
  ),
];

console.log('Allowed CORS origins:', allowedOrigins);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl / Render health-check requests (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`CORS blocked: ${origin}`);
    callback(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true, // required for httpOnly JWT cookie to be sent cross-origin
});

// Apply CORS to all routes
app.use(corsMiddleware);

// Explicitly handle preflight OPTIONS requests for every route.
// Without this, OPTIONS hits the rate limiter and returns 429 before
// the CORS headers are written, which browsers report as a CORS error.
app.options('*', corsMiddleware);

// ─── Security headers (Helmet) ────────────────────────────────────────────────
// Applied after CORS so Helmet's crossOriginResourcePolicy does not
// interfere with the CORS preflight response.
app.use(helmet());

// ─── Rate limiting ────────────────────────────────────────────────────────────
// General API limit: 100 req / 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please try again in 15 minutes.' },
  skip: (req) => !IS_PROD && req.ip === '::1', // skip localhost in dev
});

// Stricter limit for auth endpoints: 10 attempts / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts — please try again in 15 minutes.' },
  handler: (req, res, _next, options) => {
    // Log auth rate-limit hits for monitoring
    console.warn(`⚠️  Auth rate limit hit: IP=${req.ip} PATH=${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Cookie parsing ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── NoSQL injection sanitization ────────────────────────────────────────────
// Strips keys containing '$' or '.' from req.body, req.params, req.query
// This prevents operators like { "$gt": "" } from being injected.
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized potential NoSQL injection: key=${key} IP=${req.ip}`);
  },
}));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ success: true, status: 'OK', app: 'RedThread API', env: process.env.NODE_ENV || 'development' })
);

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/nodes',   nodeRoutes);
app.use('/api/threads', threadRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// ─── Global error handler (MUST be last) ─────────────────────────────────────
app.use(globalErrorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 RedThread API  port=${PORT}  env=${process.env.NODE_ENV || 'development'}`);
  log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─── Safety net for unhandled async errors ────────────────────────────────────
// Catches any promise rejection that escapes try/catch blocks.
// Logs the reason and closes the server cleanly before exiting,
// so Render sees a non-zero exit code and restarts the service.
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled promise rejection:', reason);
  server.close(() => process.exit(1));
});
