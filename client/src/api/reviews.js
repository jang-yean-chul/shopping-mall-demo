import api from './axios';

export const getReviews  = (productId, params) =>
  api.get(`/api/products/${productId}/reviews`, { params });

export const getMyReview = (productId) =>
  api.get(`/api/products/${productId}/reviews/my`);

export const upsertReview = (productId, data) =>
  api.post(`/api/products/${productId}/reviews`, data);

export const uploadReviewImage = (file) => {
  const fd = new FormData();
  fd.append('image', file);
  return api.post('/api/upload/user', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
