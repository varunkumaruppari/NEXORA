import express from 'express';
import { body, validationResult } from 'express-validator';
import { analyzeCase, getDemoCases, submitHumanDecision, getCaseById } from '../controllers/caseController.js';

const router = express.Router();

// Validation Middleware for case analysis
const validateAnalyzeRequest = [
  body('message')
    .notEmpty()
    .withMessage('Customer message is required')
    .isString()
    .withMessage('Message must be a string')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Message must be at least 1 character long'),
  body('orderId').optional({ checkFalsy: true, nullable: true }).isString().trim(),
  body('returnReason').optional({ checkFalsy: true, nullable: true }).isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('⚠️ Validation failed for /api/cases/analyze:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

/**
 * @route   POST /api/cases/analyze
 * @desc    Submit customer problem to 7-agent workflow
 * @access  Public
 */
router.post('/analyze', validateAnalyzeRequest, analyzeCase);

/**
 * @route   GET /api/cases/demo
 * @desc    Fetch test demo scenarios
 * @access  Public
 */
router.get('/demo', getDemoCases);

/**
 * @route   POST /api/cases/:id/human-decision
 * @desc    Submit a human override decision (APPROVE, DENY, REQUEST_MORE_INFO)
 * @access  Public
 */
router.post('/:id/human-decision', submitHumanDecision);

/**
 * @route   GET /api/cases/:id
 * @desc    Get case details by ID
 * @access  Public
 */
router.get('/:id', getCaseById);

export default router;
