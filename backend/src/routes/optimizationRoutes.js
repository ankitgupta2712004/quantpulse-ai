import express from 'express';
import { analyzePortfolioOptimization } from '../controllers/optimizationController.js';

const router = express.Router();

router.post('/analyze', analyzePortfolioOptimization);

export default router;
