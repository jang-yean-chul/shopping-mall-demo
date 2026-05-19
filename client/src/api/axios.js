import axios from 'axios';
import useAuthStore from '@/store/authStore';

// 개발: Vite 프록시(/api → localhost:5000)를 경유
// 운영: VITE_API_URL 환경변수로 서버 주소 지정
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes('/api/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
