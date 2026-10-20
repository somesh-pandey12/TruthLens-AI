const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../utils/helpers');

router.post('/register', authLimiter, asyncHandler(c.register));
router.post('/login', authLimiter, asyncHandler(c.login));
router.get('/me', requireAuth, asyncHandler(c.me));

module.exports = router;