import express from 'express';
import { getProducts, getAdminProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { getReviews, getMyReview, upsertReview } from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/admin', protect, adminOnly, getAdminProducts);
router.get('/:id', getProduct);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// 리뷰 (상품 하위 라우트)
router.get('/:id/reviews',     getReviews);
router.get('/:id/reviews/my',  protect, getMyReview);
router.post('/:id/reviews',    protect, upsertReview);

export default router;
