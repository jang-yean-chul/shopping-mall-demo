import { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { adminGetOrders } from '@/api/admin';
import Pagination from '@/components/common/Pagination';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (src) => {
  if (!src) return null;
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

const ORDER_STEPS   = ['pending', 'confirmed', 'shipped', 'delivered'];
const STEP_LABELS   = { pending: '결제 대기', confirmed: '주문 확인', shipped: '배송 중', delivered: '배송 완료' };
const PAY_STATUS    = { unpaid: '미결제', paid: '결제완료', refunded: '환불완료' };
const PAY_COLOR     = { unpaid: '#f59e0b', paid: '#10b981', refunded: '#6b7280' };
const PAYMENT_LABEL = { card: '신용/체크카드', kakao: '카카오페이', naver: '네이버페이', transfer: '무통장 입금', vbank: '가상계좌' };

const FILTER_TABS = [
  { value: 'all',       label: '전체' },
  { value: 'pending',   label: '결제 대기' },
  { value: 'confirmed', label: '주문 확인' },
  { value: 'shipped',   label: '배송 중' },
  { value: 'delivered', label: '배송 완료' },
  { value: 'cancelled', label: '취소됨' },
];

const LIMIT = 10;

/* ── 스텝 바 ───────────────────────────────────────── */
function OrderStepBar({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="ao-step-cancelled">
        <span className="ao-step-cancelled-icon">✕</span>{' '}주문 취소됨
      </div>
    );
  }
  const currentIdx = ORDER_STEPS.indexOf(status);
  const items = [];
  ORDER_STEPS.forEach((step, idx) => {
    const done   = idx <= currentIdx;
    const active = idx === currentIdx;
    items.push(
      <div key={step} className={`ao-step${done ? ' ao-step--done' : ''}${active ? ' ao-step--active' : ''}`}>
        <span className="ao-step-dot" />
        <span className="ao-step-label">{STEP_LABELS[step]}</span>
      </div>,
    );
    if (idx < ORDER_STEPS.length - 1) {
      items.push(
        <div key={`conn-${step}`} className={`ao-step-conn${done && currentIdx > idx ? ' ao-step-conn--done' : ''}`} />,
      );
    }
  });
  return <div className="ao-steps">{items}</div>;
}
OrderStepBar.propTypes = { status: PropTypes.string.isRequired };

/* ── 주문 카드 ─────────────────────────────────────── */
function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? order.items : order.items.slice(0, 2);

  return (
    <div className="ao-card">
      {/* 헤더: 주문번호 / 날짜 / 회원 */}
      <div className="ao-card-head">
        <div className="ao-head-left">
          <code className="ao-order-num">{order.orderNumber ?? order._id.slice(-8)}</code>
          <span className="ao-order-date">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>
        <div className="ao-user-info">
          <span className="ao-user-name">{order.user?.name ?? '-'}</span>
          <span className="ao-user-email">{order.user?.email ?? ''}</span>
        </div>
      </div>

      {/* 주문 단계 */}
      <OrderStepBar status={order.status} />

      {/* 상품 목록 */}
      <ul className="ao-item-list">
        {visibleItems.map((item) => {
          const img = getImgSrc(item.image);
          return (
            <li key={item._id} className="ao-item">
              <div className="ao-item-img">
                {img && <img src={img} alt={item.name} />}
              </div>
              <span className="ao-item-name">{item.name}</span>
              <span className="ao-item-qty">× {item.quantity}</span>
              <span className="ao-item-price">{(item.price * item.quantity).toLocaleString()}원</span>
            </li>
          );
        })}
      </ul>
      {order.items.length > 2 && (
        <button className="ao-expand-btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : `외 ${order.items.length - 2}개 더보기`}
        </button>
      )}

      {/* 결제 요약 */}
      <div className="ao-footer">
        <span className="ao-pay-method">{PAYMENT_LABEL[order.payment?.method] ?? '-'}</span>
        <div className="ao-footer-right">
          <span className="ao-pay-status" style={{ color: PAY_COLOR[order.paymentStatus] }}>
            {PAY_STATUS[order.paymentStatus] ?? order.paymentStatus}
          </span>
          <span className="ao-total">{order.totalAmount.toLocaleString()}원</span>
        </div>
      </div>
    </div>
  );
}
OrderCard.propTypes = {
  order: PropTypes.shape({
    _id:           PropTypes.string.isRequired,
    orderNumber:   PropTypes.string,
    createdAt:     PropTypes.string.isRequired,
    status:        PropTypes.string.isRequired,
    paymentStatus: PropTypes.string.isRequired,
    items:         PropTypes.array.isRequired,
    totalAmount:   PropTypes.number.isRequired,
    payment:       PropTypes.object,
    user:          PropTypes.object,
  }).isRequired,
};

/* ── 메인 페이지 ───────────────────────────────────── */
export default function AdminOrders() {
  const [page, setPage]               = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, search, statusFilter],
    queryFn:  () => adminGetOrders({
      page,
      limit:  LIMIT,
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }).then((r) => r.data),
  });

  const orders       = data?.orders       ?? [];
  const total        = data?.total        ?? 0;
  const totalPages   = data?.totalPages   ?? 1;
  const statusCounts = data?.statusCounts ?? {};

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const renderContent = () => {
    if (isLoading) return <p className="admin-loading">불러오는 중...</p>;
    if (orders.length === 0) {
      return (
        <p className="admin-empty">
          {search ? `"${search}" 검색 결과가 없습니다.` : '주문 내역이 없습니다.'}
        </p>
      );
    }
    return (
      <div className="ao-list">
        {orders.map((order) => <OrderCard key={order._id} order={order} />)}
      </div>
    );
  };

  return (
    <div>
      <h1 className="admin-page-title">주문 관리</h1>

      {/* 상태 필터 탭 */}
      <div className="od-filter-tabs" role="tablist">
        {FILTER_TABS.map((tab) => {
          const count = tab.value === 'all'
            ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
            : (statusCounts[tab.value] ?? 0);
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={statusFilter === tab.value}
              className={`od-filter-tab${statusFilter === tab.value ? ' od-filter-tab--active' : ''}`}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            >
              {tab.label}
              {count > 0 && <span className="od-filter-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-title">전체 주문 ({total}건)</span>
          <form className="admin-search-form" onSubmit={handleSearch}>
            <input
              className="admin-search-input"
              placeholder="주문번호 · 회원명 검색"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="admin-btn admin-btn--primary">검색</button>
            {search && (
              <button type="button" className="admin-btn admin-btn--outline" onClick={handleReset}>
                초기화
              </button>
            )}
          </form>
        </div>
        {renderContent()}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
