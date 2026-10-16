const router = require('express').Router();
const c = require('../controllers/analysis.controller');
const sys = require('../controllers/system.controller');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { analyzeLimiter } = require('../middleware/rateLimiters');

router.get('/warmup', sys.warmup);
router.get('/ml-status', asyncHandler(sys.mlStatus));
router.post('/analyze', analyzeLimiter, optionalAuth, validate(c.analyzeSchema), asyncHandler(c.analyze));
router.get('/history', requireAuth, asyncHandler(c.history));
router.get('/export', requireAuth, asyncHandler(c.exportCsv));
router.get('/stats', requireAuth, asyncHandler(c.stats));
router.delete('/history/:id', requireAuth, asyncHandler(c.remove));

module.exports = router;