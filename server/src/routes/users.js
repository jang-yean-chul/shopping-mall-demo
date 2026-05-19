import express from 'express';
import { getProfile, updateProfile, getUsers } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, adminOnly, getUsers);

export default router;
