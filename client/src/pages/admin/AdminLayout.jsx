import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import './Admin.css';

const NAV = [
  { to: '/admin',          label: '대시보드',   exact: true },
  { to: '/admin/products', label: '상품 관리' },
  { to: '/admin/orders',   label: '주문 관리' },
  { to: '/admin/users',    label: '회원 관리' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span>ShopMall</span>
          <small>관리자</small>
        </div>

        <nav className="admin-nav">
          {NAV.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <p className="admin-sidebar-user">{user?.name}</p>
          <div className="admin-sidebar-actions">
            <button onClick={() => navigate('/')}>쇼핑몰로 이동</button>
            <button onClick={handleLogout} className="admin-logout-btn">로그아웃</button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
