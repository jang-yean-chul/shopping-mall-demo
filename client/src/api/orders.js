import api from './axios';

export const getOrders  = ()    => api.get('/api/orders');
export const getOrder   = (id)  => api.get(`/api/orders/${id}`);
export const createOrder = (data) => api.post('/api/orders', data);

// 구매자 취소
export const cancelOrder = (id, reason) =>
  api.patch(`/api/orders/${id}/cancel`, { reason });

// 결제 확인 (PG 콜백 수신 후 서버에 전달)
export const confirmPayment = (id, payload) =>
  api.post(`/api/orders/${id}/payment/confirm`, payload);

// 관리자 - 운송장 등록
export const updateDelivery = (id, data) =>
  api.patch(`/api/orders/${id}/delivery`, data);

// 관리자 - 주문 상태 변경
export const updateOrderStatus = (id, status, note) =>
  api.patch(`/api/orders/${id}/status`, { status, note });
