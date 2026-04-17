const express = require('express');
const router  = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect }    = require('../middleware/authMiddleware');
const validate       = require('../middleware/validate');
const { registerRules, loginRules } = require('../middleware/validationRules');

// POST /api/auth/register
router.post('/register', registerRules, validate, register);

// POST /api/auth/login
router.post('/login', loginRules, validate, login);

// POST /api/auth/logout  (no auth guard — anyone can clear their cookie)
router.post('/logout', logout);

// GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
