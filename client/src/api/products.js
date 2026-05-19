import api from './axios';

export const getProducts = (params) => api.get('/api/products', { params });
export const getProduct = (id) => api.get(`/api/products/${id}`);
