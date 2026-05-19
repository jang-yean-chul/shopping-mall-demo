import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrder } from '@/api/orders';
import './OrderCompletePage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (src) => {
  if (!src) return null;
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

const PAYMENT_LABEL = {
  card:     '신용/체크카드',
  kakao:    '카카오페이',
  naver:    '네이버페이',
  transfer: '무통장 입금',
  vbank:    '가상계좌',
};

function BagIcon() {
  return (
    <svg className="oc-bag-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="24" width="48" height="34" rx="4" fill="#f3f0ff" stroke="var(--color-primary)" strokeWidth="2.5"/>
      <path d="M22 24v-4a10 10 0 0120 0v4" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 35c0 4.418 3.582 8 8 8s8-3.582 8-8" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function OrderCompletePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => getOrder(id).then((r) => r.data),
  });

  if (isLoading) return <p className="loading-text container">불러오는 중...</p>;
  if (!data?.order) {
    return (
      <div className="container page-wrapper oc-not-found">
        <p>주문 정보를 찾을 수 없습니다.</p>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>주문 목록으로</button>
      </div>
    );
  }

  const { order } = data;
  const orderDate = new Date(order.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="oc-page container page-wrapper">

      {/* 상단 완료 헤더 */}
      <div className="oc-header">
        <BagIcon />
        <h1 className="oc-title">주문이 완료되었습니다</h1>
        <p className="oc-subtitle">
          {orderDate} 주문하신 상품의 주문번호는{' '}
          <strong className="oc-order-num">{order.orderNumber}</strong> 입니다.
        </p>
      </div>

      {/* 주문 상품 */}
      <section className="oc-section">
        <h2 className="oc-section-title">주문 상품</h2>
        <table className="oc-table">
          <thead>
            <tr>
              <th className="oc-th oc-th-name">상품명</th>
              <th className="oc-th">수량</th>
              <th className="oc-th">할인금액</th>
              <th className="oc-th">결제금액</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const img = getImgSrc(item.image);
              return (
                <tr key={item._id} className="oc-tr">
                  <td className="oc-td oc-td-name">
                    <div className="oc-item-img">
                      {img && <img src={img} alt={item.name} />}
                    </div>
                    <span className="oc-item-name">{item.name}</span>
                  </td>
                  <td className="oc-td oc-td-center">{item.quantity}</td>
                  <td className="oc-td oc-td-center oc-discount">0원</td>
                  <td className="oc-td oc-td-price">
                    {(item.price * item.quantity).toLocaleString()}원
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 배송지 + 결제 정보 */}
      <div className="oc-bottom">
        <section className="oc-section oc-half">
          <h2 className="oc-section-title">배송지 정보</h2>
          <div className="oc-info-rows">
            <div className="oc-info-row">
              <span className="oc-info-label">이름</span>
              <span>{order.shippingAddress.recipient}</span>
            </div>
            <div className="oc-info-row">
              <span className="oc-info-label">휴대폰번호</span>
              <span>{order.shippingAddress.phone}</span>
            </div>
            <div className="oc-info-row">
              <span className="oc-info-label">배송지 주소</span>
              <span>
                ({order.shippingAddress.zipCode}){' '}
                {order.shippingAddress.street}
                {order.shippingAddress.detail ? ` ${order.shippingAddress.detail}` : ''}
              </span>
            </div>
            {order.shippingAddress.memo && (
              <div className="oc-info-row">
                <span className="oc-info-label">배송 메모</span>
                <span>{order.shippingAddress.memo}</span>
              </div>
            )}
          </div>
        </section>

        <section className="oc-section oc-half">
          <h2 className="oc-section-title">결제 정보</h2>
          <div className="oc-info-rows">
            <div className="oc-info-row">
              <span className="oc-info-label">결제 수단</span>
              <span>{PAYMENT_LABEL[order.payment?.method] ?? '-'}</span>
            </div>
            <div className="oc-info-row">
              <span className="oc-info-label">상품금액</span>
              <span>{(order.itemsTotal ?? order.totalAmount).toLocaleString()}원</span>
            </div>
            <div className="oc-info-row">
              <span className="oc-info-label">할인 금액</span>
              <span className="oc-discount">
                {order.discountAmount > 0 ? `-${order.discountAmount.toLocaleString()}원` : '0원'}
              </span>
            </div>
            <div className="oc-info-row">
              <span className="oc-info-label">배송비</span>
              <span>{order.shippingFee === 0 ? '무료' : `${order.shippingFee.toLocaleString()}원`}</span>
            </div>
            <div className="oc-info-row oc-total-row">
              <span className="oc-info-label">총 결제 금액</span>
              <strong className="oc-total-amount">{order.totalAmount.toLocaleString()}원</strong>
            </div>
          </div>
        </section>
      </div>

      {/* 액션 버튼 */}
      <div className="oc-actions">
        <button className="btn oc-btn-outline" onClick={() => navigate('/orders')}>
          주문 내역 보기
        </button>
        <button className="btn btn-primary oc-btn-primary" onClick={() => navigate('/products')}>
          쇼핑 계속하기
        </button>
      </div>
    </div>
  );
}
