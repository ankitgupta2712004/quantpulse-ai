import express from 'express';
import { getNewsSentiment, analyzeTextSentiment } from '../controllers/newsController.js';

const router = express.Router();

router.get('/:symbol', getNewsSentiment);
router.post('/analyze', analyzeTextSentiment);

export default router;
