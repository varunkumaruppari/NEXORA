import express from 'express';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    API Health Check
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RESOLV AI API is running',
  });
});

export default router;
