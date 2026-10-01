import express from 'express';
import {
  trainModel,
  predict,
  getEvaluation,
  listModels,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/train', protect, trainModel);
router.post('/predict', protect, predict);
router.get('/evaluation/:symbol', protect, getEvaluation);
router.get('/models', protect, listModels);

export default router;
