import { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, cancelOrder } from '@/api/orders';
import './OrdersPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (src) => {
  if (!src) return null;
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

const STATUS_META = {
  pending:   { label: '결제 대기',  color: '#f59e0b' },
  confirmed: { label: '주문 확인',  color: '#3b82f6' },
  shipped:   { label: '배송 중',    color: '#8b5cf6' },
  delivered: { label: '배송 완료',  color: '#10b981' },
  cancelled: { label: '취소됨',     color: '#ef4444' },
};

const PAYMENT_LABEL = {
  card:     '신용/체크카드',
  kakao:    '카카오페이',
  naver:    '네이버페이',
  transfer: '무통장 입금',
  vbank:    '가상계좌',
};

const CANCEL_REASONS = ['단순 변심', '사이즈/색상 변경', '배송 지연', '상품 품절', '기타'];

const ORDER_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const STEP_LABELS = { pending: '결제 대기', confirmed: '주문 확인', shipped: '배송 중', delivered: '배송 완료' };

const FILTER_TABS = [
  { value: 'all',       label: '전체' },
  { value: 'pending',   label: '결제 대기' },
  { value: 'confirmed', label: '주문 확인' },
  { value: 'shipped',   label: '배송 중' },
  { value: 'delivered', label: '배송 완료' },
  { value: 'cancelled', label: '취소됨' },
];

/* ── 주문 스텝 바 ────────────────────────────────────── */
function OrderStepBar({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="od-step-cancelled">
        <span className="od-step-cancelled-icon">✕</span>{' '}주문 취소됨
      </div>
    );
  }

  const currentIdx = ORDER_STEPS.indexOf(status);
  const items = [];

  ORDER_STEPS.forEach((step, idx) => {
    const done   = idx <= currentIdx;
    const active = idx === currentIdx;
    items.push(
      <div
        key={step}
        className={`od-step${done ? ' od-step--done' : ''}${active ? ' od-step--active' : ''}`}
      >
        <span className="od-step-dot" />
        <span className="od-step-label">{STEP_LABELS[step]}</span>
      </div>,
    );
    if (idx < ORDER_STEPS.length - 1) {
      items.push(
        <div
          key={`conn-${step}`}
          className={`od-step-conn${done && currentIdx > idx ? ' od-step-conn--done' : ''}`}
        />,
      );
    }
  });

  return <div className="od-steps">{items}</div>;
}
OrderStepBar.propTypes = { status: PropTypes.string.isRequired };

/* ── 취소 확인 모달 ─────────────────────────────────── */
function CancelModal({ orderId, onClose, onConfirm, isPending }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  return (
    <>
      <button
        type="button"
        className="od-modal-backdrop"
        onClick={onClose}
        aria-label="모달 닫기"
      />
      <dialog open className="od-modal">
        <h3 className="od-modal-title">주문 취소</h3>
        <p className="od-modal-desc">취소 사유를 선택해주세요.</p>
        <select
          className="od-modal-select"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {CANCEL_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <div className="od-modal-actions">
          <button className="od-modal-btn od-modal-btn--cancel" onClick={onClose}>
            닫기
          </button>
          <button
            className="od-modal-btn od-modal-btn--confirm"
            onClick={() => onConfirm(orderId, reason)}
            disabled={isPending}
          >
            {isPending ? '처리 중...' : '취소 확인'}
          </button>
        </div>
      </dialog>
    </>
  );
}
CancelModal.propTypes = {
  orderId:   PropTypes.string.isRequired,
  onClose:   PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isPending: PropTypes.bool,
};

/* ── 주문 카드 ──────────────────────────────────────── */
function OrderCard({ order, onCancelClick }) {
  const [expanded, setExpanded] = useState(false);
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <div className="od-card">
      {/* 헤더 */}
      <div className="od-card-head">
        <div className="od-head-left">
          <span className="od-order-num">
            {order.orderNumber ?? order._id.slice(-8).toUpperCase()}
          </span>
          <span className="od-order-date">
            {new Date(order.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
        {canCancel && (
          <button className="od-cancel-btn" onClick={() => onCancelClick(order._id)}>
            주문 취소
          </button>
        )}
      </div>

      {/* 진행 단계 */}
      <OrderStepBar status={order.status} />

      {/* 상품 목록 */}
      <ul className="od-item-list">
        {(expanded ? order.items : order.items.slice(0, 2)).map((item) => {
          const img = getImgSrc(item.image);
          return (
            <li key={item._id} className="od-item">
              <div className="od-item-img">
                {img && <img src={img} alt={item.name} />}
              </div>
              <div className="od-item-body">
                <p className="od-item-name">{item.name}</p>
                {(item.size || item.color?.name) && (
                  <p className="od-item-opts">
                    {item.size && <span>{item.size}</span>}
                    {item.color?.name && (
                      <span className="od-color-wrap">
                        <span className="od-color-dot" style={{ background: item.color.hex }} />
                        {item.color.name}
                      </span>
                    )}
                  </p>
                )}
                <p className="od-item-qty">수량 {item.quantity}개</p>
              </div>
              <p className="od-item-price">{(item.price * item.quantity).toLocaleString()}원</p>
            </li>
          );
        })}
      </ul>

      {order.items.length > 2 && (
        <button className="od-expand-btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : `외 ${order.items.length - 2}개 더보기`}
        </button>
      )}

      {/* 결제 · 배송 정보 */}
      <div className="od-info-grid">
        <div className="od-info-row">
          <span className="od-info-label">결제 수단</span>
          <span className="od-info-val">
            {PAYMENT_LABEL[order.payment?.method] ?? '미선택'}
          </span>
        </div>
        <div className="od-info-row">
          <span className="od-info-label">결제 상태</span>
          <span className={`od-pay-status od-pay-status--${order.paymentStatus}`}>
            {{ unpaid: '미결제', paid: '결제완료', refunded: '환불완료' }[order.paymentStatus]}
          </span>
        </div>
        {order.delivery?.trackingNumber && (
          <div className="od-info-row">
            <span className="od-info-label">운송장</span>
            <span className="od-info-val">
              {order.delivery.carrier} {order.delivery.trackingNumber}
            </span>
          </div>
        )}
        {order.cancellation?.reason && (
          <div className="od-info-row">
            <span className="od-info-label">취소 사유</span>
            <span className="od-info-val">{order.cancellation.reason}</span>
          </div>
        )}
      </div>

      {/* 금액 요약 */}
      <div className="od-amount-summary">
        <div className="od-amount-row">
          <span>상품 금액</span>
          <span>{(order.itemsTotal ?? order.totalAmount).toLocaleString()}원</span>
        </div>
        {order.shippingFee > 0 && (
          <div className="od-amount-row">
            <span>배송비</span>
            <span>{order.shippingFee.toLocaleString()}원</span>
          </div>
        )}
        <div className="od-amount-total">
          <span>최종 결제금액</span>
          <span>{order.totalAmount.toLocaleString()}원</span>
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
    itemsTotal:    PropTypes.number,
    shippingFee:   PropTypes.number,
    payment:       PropTypes.object,
    delivery:      PropTypes.object,
    cancellation:  PropTypes.object,
  }).isRequired,
  onCancelClick: PropTypes.func.isRequired,
};

/* ── 메인 페이지 ────────────────────────────────────── */
export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn:  () => getOrders().then((r) => r.data),
  });

  const { mutate: doCancel, isPending: cancelling } = useMutation({
    mutationFn: ({ id, reason }) => cancelOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancelTargetId(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message ?? '취소에 실패했습니다.');
    },
  });

  if (isLoading) return <p className="loading-text container">불러오는 중...</p>;

  const allOrders = data?.orders ?? [];

  const counts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab.value] = tab.value === 'all'
      ? allOrders.length
      : allOrders.filter((o) => o.status === tab.value).length;
    return acc;
  }, {});

  const filtered = statusFilter === 'all'
    ? allOrders
    : allOrders.filter((o) => o.status === statusFilter);

  return (
    <div className="od-page container page-wrapper">
      <h1 className="od-title">주문 내역</h1>

      {/* 상태 필터 탭 */}
      <div className="od-filter-tabs" role="tablist">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={statusFilter === tab.value}
            className={`od-filter-tab${statusFilter === tab.value ? ' od-filter-tab--active' : ''}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            {counts[tab.value] > 0 && (
              <span className="od-filter-count">{counts[tab.value]}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="od-empty">
          {statusFilter === 'all' ? '주문 내역이 없습니다.' : `${STATUS_META[statusFilter]?.label ?? statusFilter} 주문이 없습니다.`}
        </p>
      ) : (
        <div className="od-list">
          {filtered.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onCancelClick={(id) => setCancelTargetId(id)}
            />
          ))}
        </div>
      )}

      {cancelTargetId && (
        <CancelModal
          orderId={cancelTargetId}
          onClose={() => setCancelTargetId(null)}
          onConfirm={(id, reason) => doCancel({ id, reason })}
          isPending={cancelling}
        />
      )}
    </div>
  );
}
