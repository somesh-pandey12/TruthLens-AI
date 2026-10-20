const router = require('express').Router();
const c = require('../controllers/analysis.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { analyzeLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../utils/helpers');

router.get('/status', c.status);
router.post('/analyze', analyzeLimiter, optionalAuth, asyncHandler(c.analyze));
router.get('/history', requireAuth, asyncHandler(c.history));
router.delete('/history/:id', requireAuth, asyncHandler(c.remove));

module.exports = router;