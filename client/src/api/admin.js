import api from './axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getImageUrl = (src) => {
  if (!src) return null;
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

// 상품 관리
export const adminGetProducts   = (params)       => api.get('/api/products/admin', { params });
export const adminCreateProduct = (data)         => api.post('/api/products', data);
export const adminUpdateProduct = (id, data)     => api.put(`/api/products/${id}`, data);
export const adminDeleteProduct = (id)           => api.delete(`/api/products/${id}`);

// Cloudinary 위젯 서명 (API Secret은 서버에서만 보관)
export const adminGetUploadSignature = (paramsToSign) => api.post('/api/upload/sign', paramsToSign);

// 주문 관리
export const adminGetOrders         = (params)       => api.get('/api/orders/all', { params });
export const adminUpdateOrderStatus = (id, status)   => api.patch(`/api/orders/${id}/status`, { status });

// 회원 관리
export const adminGetUsers = (params) => api.get('/api/users', { params });

// 최근 리뷰 (대시보드용)
export const adminGetRecentReviews = (limit = 8) =>
  api.get('/api/reviews/recent', { params: { limit } });
