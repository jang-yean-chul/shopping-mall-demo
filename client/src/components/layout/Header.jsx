import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import useWishlistStore from '@/store/wishlistStore';
import './Header.css';

const CATEGORIES = [
  { label: 'ALL',    value: '' },
  { label: '상의',   value: 'top' },
  { label: '하의',   value: 'bottom' },
  { label: '아우터', value: 'outer' },
  { label: '원피스', value: 'dress' },
  { label: '가방',   value: 'bag' },
  { label: '신발',   value: 'shoes' },
  { label: '액세서리', value: 'acc' },
  { label: '아울렛', value: 'outlet' },
];

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Header() {
  const { user, token, logout } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const searchRef = useRef(null);
  const userDropdownRef = useRef(null);

  const cartCount = items.length;

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileSearchOpen) searchRef.current?.focus();
  }, [mobileSearchOpen]);

  const getCategory = () => new URLSearchParams(location.search).get('category') || '';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="site-header">
        {/* 메인 헤더 */}
        <div className="header-main">
          <div className="container header-main-inner">
            {/* 모바일: 햄버거 / 데스크톱: 검색 */}
            <div className="header-left">
              <button
                className="header-hamburger"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="메뉴 열기"
              >
                {mobileMenuOpen ? <IconClose /> : <IconMenu />}
              </button>
              <form className="header-search" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="상품 검색"
                />
                <button type="submit" className="header-search-btn" aria-label="검색">
                  <IconSearch />
                </button>
              </form>
            </div>

            {/* 로고 */}
            <Link to="/" className="header-logo">ShopMall</Link>

            {/* 우측 액션 */}
            <div className="header-right">
              <button
                className="header-mobile-search-btn"
                onClick={() => setMobileSearchOpen((v) => !v)}
                aria-label="검색"
              >
                <IconSearch />
              </button>
              {token && (
                <>
                  <Link to="/wishlist" className="header-icon-btn" aria-label="찜목록">
                    <span className="header-icon-wrap">
                      <IconHeart />
                      {wishlistCount > 0 && <span className="header-icon-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
                    </span>
                    <span className="header-icon-label">찜목록</span>
                  </Link>
                  <Link to="/cart" className="header-icon-btn" aria-label="장바구니">
                    <span className="header-icon-wrap">
                      <IconCart />
                      {cartCount > 0 && <span className="header-icon-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
                    </span>
                    <span className="header-icon-label">장바구니</span>
                  </Link>
                </>
              )}
              {user?.user_type === 'admin' && (
                <Link to="/admin" className="header-admin-btn">관리자 메뉴</Link>
              )}
              {token ? (
                <div className="header-user-dropdown" ref={userDropdownRef}>
                  <button
                    className="header-icon-btn"
                    onClick={() => setUserDropdownOpen((v) => !v)}
                    aria-label="계정 메뉴"
                  >
                    <span className="header-icon-wrap"><IconUser /></span>
                    <span className="header-icon-label">{user?.name || '내 계정'}</span>
                  </button>
                  {userDropdownOpen && (
                    <div className="header-user-menu">
                      <Link to="/orders" className="header-user-menu-item">주문조회</Link>
                      <button className="header-user-menu-item header-user-menu-logout" onClick={handleLogout}>
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="header-icon-btn" aria-label="로그인">
                    <span className="header-icon-wrap"><IconUser /></span>
                    <span className="header-icon-label">로그인</span>
                  </Link>
                  <Link to="/register" className="header-icon-btn" aria-label="회원가입">
                    <span className="header-icon-wrap">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                    </span>
                    <span className="header-icon-label">회원가입</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 모바일 검색 바 */}
        <div className={`header-mobile-search${mobileSearchOpen ? ' open' : ''}`}>
          <form className="container" onSubmit={handleSearch}>
            <input
              ref={searchRef}
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" aria-label="검색"><IconSearch /></button>
          </form>
        </div>

        {/* 카테고리 네비게이션 */}
        <nav className="header-nav">
          <div className="container header-nav-inner">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                to={cat.value ? `/products?category=${cat.value}` : '/products'}
                className={`header-nav-item${getCategory() === cat.value ? ' active' : ''}`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* 모바일 풀스크린 메뉴 */}
      <div className={`mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
        <div className="mobile-menu-body">
          {token ? (
            <div className="mobile-menu-user">
              <span className="mobile-menu-greeting">{user?.name || '회원'}님, 안녕하세요</span>
            </div>
          ) : (
            <div className="mobile-menu-auth">
              <Link to="/login" className="btn btn-primary btn-full">로그인</Link>
              <Link to="/register" className="btn btn-outline btn-full">회원가입</Link>
            </div>
          )}

          <div className="mobile-menu-section">
            <p className="mobile-menu-section-title">카테고리</p>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                to={cat.value ? `/products?category=${cat.value}` : '/products'}
                className={`mobile-menu-item${getCategory() === cat.value ? ' active' : ''}`}
              >
                {cat.label}
              </Link>
            ))}
          </div>

          <div className="mobile-menu-section">
            <p className="mobile-menu-section-title">서비스</p>
            {token && (
              <>
                <Link to="/wishlist" className="mobile-menu-item">
                  찜목록 {wishlistCount > 0 && <span className="mobile-menu-badge">{wishlistCount}</span>}
                </Link>
                <Link to="/cart" className="mobile-menu-item">
                  장바구니 {cartCount > 0 && <span className="mobile-menu-badge">{cartCount}</span>}
                </Link>
              </>
            )}
            {token && <button className="mobile-menu-item mobile-menu-logout" onClick={handleLogout}>로그아웃</button>}
          </div>
        </div>
      </div>

      {/* 오버레이 */}
      {mobileMenuOpen && (
        <button
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="메뉴 닫기"
        />
      )}
    </>
  );
}
