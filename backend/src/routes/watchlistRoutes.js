import express from 'express';
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from '../controllers/watchlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, addToWatchlist)
  .get(protect, getWatchlist);

router.route('/:symbol')
  .delete(protect, removeFromWatchlist);

export default router;
