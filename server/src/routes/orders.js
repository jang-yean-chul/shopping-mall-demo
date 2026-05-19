import express from 'express';
import {
  getOrders,
  getAllOrders,
  createOrder,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  confirmPayment,
  updateDelivery,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// 주문 목록
router.get('/',    protect, getOrders);
router.get('/all', protect, adminOnly, getAllOrders);

// 주문 생성
router.post('/', protect, createOrder);

// 단건 조회
router.get('/:id', protect, getOrder);

// 상태 변경 (관리자)
router.patch('/:id/status',   protect, adminOnly, updateOrderStatus);

// 운송장 등록 (관리자)
router.patch('/:id/delivery', protect, adminOnly, updateDelivery);

// 구매자 취소
router.patch('/:id/cancel', protect, cancelOrder);

// 결제 확인 (PG 콜백 or 수동)
router.post('/:id/payment/confirm', protect, confirmPayment);

export default router;
