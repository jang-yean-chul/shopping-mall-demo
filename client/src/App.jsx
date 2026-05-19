import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PrivateRoute from '@/components/common/PrivateRoute';
import GuestRoute from '@/components/common/GuestRoute';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import WishlistPage from '@/pages/WishlistPage';
import OrdersPage from '@/pages/OrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderCompletePage from '@/pages/OrderCompletePage';
import NotFoundPage from '@/pages/NotFoundPage';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import useWishlistStore from '@/store/wishlistStore';
import { getMe } from '@/api/auth';
import AdminRoute from '@/components/common/AdminRoute';
import ScrollToTop from '@/components/common/ScrollToTop';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminUsers from '@/pages/admin/AdminUsers';
import './App.css';

function AuthSync() {
  const { token, setUser, logout } = useAuthStore();
  const hydrateCart = useCartStore((s) => s.hydrate);
  const clearCart = useCartStore((s) => s.clear);
  const hydrateWishlist = useWishlistStore((s) => s.hydrate);
  const clearWishlist = useWishlistStore((s) => s.clear);

  useEffect(() => {
    if (!token) {
      clearCart();
      clearWishlist();
      return;
    }
    getMe()
      .then(({ data }) => {
        setUser(data.user);
        hydrateCart(data.user._id);
        hydrateWishlist(data.user._id);
      })
      .catch((err) => {
        if (err.response?.status === 401) logout();
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function App() {
  return (
    <>
      <AuthSync />
      <ScrollToTop />
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/orders/:id/complete" element={<OrderCompletePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Route>
    </Routes>
    </>
  );
}
