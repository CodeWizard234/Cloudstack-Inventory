const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { aiInsights } = require('../controllers/aiController');

// @route    GET /api/ai/insights
// @desc     Get AI generated inventory insights
router.get('/insights', auth, aiInsights);

module.exports = router;module.exports = router;
