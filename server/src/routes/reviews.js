import express from 'express';
import { getRecentReviews } from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/recent', protect, adminOnly, getRecentReviews);

export default router;
