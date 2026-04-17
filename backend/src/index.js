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

// ─── Security headers (Helmet) ────────────────────────────────────────────────
// Disables x-powered-by, sets CSP, HSTS, etc.
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser clients
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true, // allow cookies across origins
  })
);

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
