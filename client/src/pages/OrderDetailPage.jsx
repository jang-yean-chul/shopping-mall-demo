import { useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrder, cancelOrder } from '@/api/orders';
import './OrdersPage.css';
import './OrderDetailPage.css';

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

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelTargetId, setCancelTargetId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => getOrder(id).then((r) => r.data),
  });

  const { mutate: doCancel, isPending: cancelling } = useMutation({
    mutationFn: ({ orderId, reason }) => cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancelTargetId(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message ?? '취소에 실패했습니다.');
    },
  });

  if (isLoading) return <p className="loading-text container">불러오는 중...</p>;
  if (!data?.order) {
    return <p className="container page-wrapper od-empty">주문을 찾을 수 없습니다.</p>;
  }

  const { order } = data;
  const meta = STATUS_META[order.status] ?? { label: order.status, color: '#6b7280' };
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <div className="od-detail container page-wrapper">
      <div className="od-detail-nav">
        <button className="od-back-btn" onClick={() => navigate('/orders')}>
          ← 주문 목록
        </button>
        <h1 className="od-title">주문 상세</h1>
      </div>

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
          <div className="od-head-right">
            <span className="od-status-badge" style={{ color: meta.color, borderColor: meta.color }}>
              {meta.label}
            </span>
            {canCancel && (
              <button className="od-cancel-btn" onClick={() => setCancelTargetId(order._id)}>
                주문 취소
              </button>
            )}
          </div>
        </div>

        {/* 전체 상품 목록 */}
        <ul className="od-item-list">
          {order.items.map((item) => {
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
          {order.shippingAddress && (
            <div className="od-info-row">
              <span className="od-info-label">배송지</span>
              <span className="od-info-val">
                {order.shippingAddress.recipient} · {order.shippingAddress.street}
                {order.shippingAddress.detail ? ` ${order.shippingAddress.detail}` : ''}
              </span>
            </div>
          )}
          {order.shippingAddress?.memo && (
            <div className="od-info-row">
              <span className="od-info-label">배송 메모</span>
              <span className="od-info-val">{order.shippingAddress.memo}</span>
            </div>
          )}
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

      {cancelTargetId && (
        <CancelModal
          orderId={cancelTargetId}
          onClose={() => setCancelTargetId(null)}
          onConfirm={(orderId, reason) => doCancel({ orderId, reason })}
          isPending={cancelling}
        />
      )}
    </div>
  );
}
