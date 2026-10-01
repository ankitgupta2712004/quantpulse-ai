import express from 'express';
import {
  getQuote,
  getHistory,
  searchSymbols,
  getCompanyStats,
} from '../controllers/marketController.js';

const router = express.Router();

router.get('/quote/:symbol', getQuote);
router.get('/history/:symbol', getHistory);
router.get('/search', searchSymbols);
router.get('/stats/:symbol', getCompanyStats);

export default router;
