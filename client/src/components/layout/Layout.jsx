import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Toast from '@/components/common/Toast';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="layout-main">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  );
}
