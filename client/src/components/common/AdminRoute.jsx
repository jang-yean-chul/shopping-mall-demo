import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function AdminRoute() {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.user_type !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
