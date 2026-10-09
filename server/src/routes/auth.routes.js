const router = require('express').Router();
const c = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, validate(c.registerSchema), asyncHandler(c.register));
router.post('/login', authLimiter, validate(c.loginSchema), asyncHandler(c.login));
router.get('/me', requireAuth, asyncHandler(c.me));

module.exports = router;