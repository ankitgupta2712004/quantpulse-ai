import express from 'express';
import {
  createPortfolio,
  getPortfolios,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
} from '../controllers/portfolioController.js';
import {
  addHolding,
  getHoldings,
} from '../controllers/holdingController.js';
import {
  addTransaction,
  getTransactions,
} from '../controllers/transactionController.js';
import {
  getPortfolioAnalytics,
  getPortfolioRiskAnalytics,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Portfolio Base CRUD
router.route('/')
  .post(protect, createPortfolio)
  .get(protect, getPortfolios);

router.route('/:id')
  .get(protect, getPortfolioById)
  .put(protect, updatePortfolio)
  .delete(protect, deletePortfolio);

// Nested Holding Routes
router.route('/:id/holdings')
  .post(protect, addHolding)
  .get(protect, getHoldings);

// Nested Transaction Routes
router.route('/:id/transactions')
  .post(protect, addTransaction)
  .get(protect, getTransactions);

// Portfolio Analytics & Quantitative Risk Routes
router.get('/:id/analytics', protect, getPortfolioAnalytics);
router.get('/:id/risk', protect, getPortfolioRiskAnalytics);

export default router;
