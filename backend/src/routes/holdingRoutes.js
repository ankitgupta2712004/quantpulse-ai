import express from 'express';
import { updateHolding, deleteHolding } from '../controllers/holdingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:id')
  .put(protect, updateHolding)
  .delete(protect, deleteHolding);

export default router;
