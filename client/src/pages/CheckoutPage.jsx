import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import * as PortOne from '@portone/browser-sdk/v2';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import { createOrder, confirmPayment } from '@/api/orders';
import './CheckoutPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (src) => {
  if (!src) return null;
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

const PAYMENT_METHODS = [
  { value: 'card',     label: '신용/체크카드' },
  { value: 'kakao',    label: '카카오페이' },
  { value: 'naver',    label: '네이버페이' },
  { value: 'transfer', label: '무통장 입금' },
  { value: 'vbank',    label: '가상계좌' },
];

const PORTONE_STORE_ID   = import.meta.env.VITE_PORTONE_STORE_ID;
const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY;

// 포트원 V2 결제수단 코드
const PAY_METHOD_MAP = {
  card:     { payMethod: 'CARD' },
  kakao:    { payMethod: 'EASY_PAY', easyPay: { easyPayProvider: 'KAKAOPAY' } },
  naver:    { payMethod: 'EASY_PAY', easyPay: { easyPayProvider: 'NAVERPAY' } },
  transfer: { payMethod: 'TRANSFER' },
  vbank:    { payMethod: 'VIRTUAL_ACCOUNT' },
};

const EMPTY_ADDR = {
  recipient: '',
  phone: '',
  zipCode: '',
  street: '',
  detail: '',
  memo: '',
};

function phoneError(phone) {
  if (phone.length === 0) return '연락처를 입력해주세요.';
  if (/^01\d{8,9}$/.test(phone)) return '';
  return '01012345678 형식으로 입력해주세요.';
}
function zipError(zip) {
  if (zip.length === 0) return '우편번호를 입력해주세요.';
  if (/^\d{5}$/.test(zip)) return '';
  return '5자리 숫자로 입력해주세요.';
}
const ADDR_ERRORS = (v) => ({
  recipient: v.recipient.trim() ? '' : '수령인을 입력해주세요.',
  phone:     phoneError(v.phone),
  zipCode:   zipError(v.zipCode),
  street:    v.street.trim() ? '' : '주소를 입력해주세요.',
});

function AddressForm({ value, onChange, showErrors }) {
  const [memoSel, setMemoSel] = useState('');
  const [touched, setTouched] = useState({});

  const errors = ADDR_ERRORS(value);
  const show   = (f) => (showErrors || touched[f]) && errors[f];
  const cls    = (f) => `co-input${show(f) ? ' co-input--error' : ''}`;

  const handleChange = (e) => {
    onChange({ ...value, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleMemoSelect = (e) => {
    const sel = e.target.value;
    setMemoSel(sel);
    onChange({ ...value, memo: sel === '__custom__' ? '' : sel });
  };

  return (
    <div className="co-addr-form">
      <div className="co-row">
        <div className="co-field">
          <label htmlFor="addr-recipient" className="co-label">수령인 *</label>
          <input
            id="addr-recipient"
            className={cls('recipient')}
            name="recipient"
            value={value.recipient}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="이름"
          />
          {show('recipient') && <span className="co-field-error">{errors.recipient}</span>}
        </div>
        <div className="co-field">
          <label htmlFor="addr-phone" className="co-label">연락처 *</label>
          <input
            id="addr-phone"
            className={cls('phone')}
            name="phone"
            type="tel"
            inputMode="numeric"
            value={value.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              onChange({ ...value, phone: digits });
            }}
            onBlur={handleBlur}
            placeholder="01012345678"
            maxLength={11}
          />
          {show('phone') && <span className="co-field-error">{errors.phone}</span>}
        </div>
      </div>
      <div className="co-field">
        <label htmlFor="addr-zipCode" className="co-label">우편번호 *</label>
        <input
          id="addr-zipCode"
          className={cls('zipCode')}
          name="zipCode"
          inputMode="numeric"
          value={value.zipCode}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            onChange({ ...value, zipCode: digits });
          }}
          onBlur={handleBlur}
          placeholder="12345"
          maxLength={5}
        />
        {show('zipCode') && <span className="co-field-error">{errors.zipCode}</span>}
      </div>
      <div className="co-field">
        <label htmlFor="addr-street" className="co-label">주소 *</label>
        <input
          id="addr-street"
          className={cls('street')}
          name="street"
          value={value.street}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="기본 주소"
        />
        {show('street') && <span className="co-field-error">{errors.street}</span>}
      </div>
      <div className="co-field">
        <label htmlFor="addr-detail" className="co-label">상세 주소</label>
        <input
          id="addr-detail"
          className="co-input"
          name="detail"
          value={value.detail}
          onChange={handleChange}
          placeholder="상세 주소 (동/호수 등)"
        />
      </div>
      <div className="co-field">
        <label htmlFor="addr-memo" className="co-label">배송 메모</label>
        <select
          id="addr-memo"
          className="co-input"
          value={memoSel}
          onChange={handleMemoSelect}
        >
          <option value="">선택 안함</option>
          <option value="문 앞에 놓아주세요">문 앞에 놓아주세요</option>
          <option value="경비실에 맡겨주세요">경비실에 맡겨주세요</option>
          <option value="배송 전 연락 바랍니다">배송 전 연락 바랍니다</option>
          <option value="부재 시 문자 남겨주세요">부재 시 문자 남겨주세요</option>
          <option value="__custom__">직접입력</option>
        </select>
        {memoSel === '__custom__' && (
          <input
            id="addr-memo-custom"
            className="co-input co-memo-custom"
            name="memo"
            value={value.memo}
            onChange={handleChange}
            placeholder="배송 메모를 입력해주세요"
            maxLength={100}
          />
        )}
      </div>
    </div>
  );
}

AddressForm.propTypes = {
  value: PropTypes.shape({
    recipient: PropTypes.string.isRequired,
    phone:     PropTypes.string.isRequired,
    zipCode:   PropTypes.string.isRequired,
    street:    PropTypes.string.isRequired,
    detail:    PropTypes.string.isRequired,
    memo:      PropTypes.string.isRequired,
  }).isRequired,
  onChange:   PropTypes.func.isRequired,
  showErrors: PropTypes.bool,
};

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const navigate = useNavigate();

  const [addr, setAddr]                   = useState(EMPTY_ADDR);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [agreeAll, setAgreeAll]           = useState(false);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [failMsg, setFailMsg] = useState('');
  const [showPolicyNotice, setShowPolicyNotice] = useState(false);

  const itemsTotal  = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const totalAmount = itemsTotal + shippingFee;

  const { mutate: confirmPay } = useMutation({
    mutationFn: ({ orderId, payload }) => confirmPayment(orderId, payload),
    onSuccess: ({ data }) => {
      clearCart();
      navigate(`/orders/${data.order._id}/complete`, { replace: true });
    },
    onError: () => {
      setFailMsg('결제 확인에 실패했습니다. 고객센터에 문의해주세요.');
      setIsProcessing(false);
    },
  });

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: (vars) =>
      createOrder({
        items: vars.items.map((i) => ({
          product:  i._id,
          quantity: i.quantity,
          size:     i.size  ?? null,
          color:    i.color ?? null,
        })),
        shippingAddress: vars.addr,
        paymentMethod:   vars.paymentMethod,
      }),
    onSuccess: async ({ data }, vars) => {
      const { order } = data;
      const methodConfig = PAY_METHOD_MAP[vars.paymentMethod] ?? PAY_METHOD_MAP.card;
      const productName =
        vars.items.length === 1
          ? vars.items[0].name
          : `${vars.items[0].name} 외 ${vars.items.length - 1}건`;

      const response = await PortOne.requestPayment({
        storeId:     PORTONE_STORE_ID,
        channelKey:  PORTONE_CHANNEL_KEY,
        paymentId:   order.orderNumber,
        orderName:   productName,
        totalAmount: order.totalAmount,
        currency:    'CURRENCY_KRW',
        payMethod:   methodConfig.payMethod,
        ...(methodConfig.easyPay && { easyPay: methodConfig.easyPay }),
        customer: {
          fullName:    vars.addr.recipient,
          email:       vars.userEmail,
          phoneNumber: vars.addr.phone.replace(/\D/g, ''),
        },
        redirectUrl: `${globalThis.location.origin}/orders`,
      });

      if (response?.code) {
        setFailMsg(response.message || '결제가 취소되었습니다.');
        setIsProcessing(false);
      } else {
        confirmPay({
          orderId: order._id,
          payload: {
            pgTransactionId: response.paymentId,
            pgProvider:      'html5_inicis',
            paidAt:          new Date().toISOString(),
          },
        });
      }
    },
    onError: (err) => {
      console.error('[createOrder error]', err.response ?? err);
      alert(err.response?.data?.message ?? err.message ?? '주문에 실패했습니다. 다시 시도해주세요.');
      setIsProcessing(false);
    },
  });

  if (items.length === 0) {
    return (
      <div className="co-empty container page-wrapper">
        <p>장바구니가 비어있습니다.</p>
      </div>
    );
  }

  const addrErrors = ADDR_ERRORS(addr);
  const addrValid  = Object.values(addrErrors).every((e) => e === '');

  const busy = isPending || isProcessing;
  let submitLabel = `${totalAmount.toLocaleString()}원 결제하기`;
  if (isPending) submitLabel = '주문 확인 중...';
  else if (isProcessing) submitLabel = '결제 진행 중...';

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!addrValid)  return;
    if (!agreeAll)   { alert('필수 약관에 동의해주세요.'); return; }
    setShowPolicyNotice(true);
  };

  const handleProceedPayment = () => {
    setShowPolicyNotice(false);
    setIsProcessing(true);
    placeOrder({ addr, paymentMethod, items, userEmail });
  };

  return (
    <>
    {showPolicyNotice && (
      <dialog className="co-fail-dialog" open>
        <div className="co-policy-icon">!</div>
        <h2 className="co-fail-title">결제 안내</h2>
        <p className="co-fail-msg">
          결제 대기 상태가 <strong>3일 이상</strong> 지속되면 주문이 자동으로 취소됩니다.{' '}
          결제를 진행해 주세요.
        </p>
        <div className="co-policy-actions">
          <button className="co-policy-btn-cancel btn" onClick={() => setShowPolicyNotice(false)}>
            닫기
          </button>
          <button className="co-policy-btn-confirm btn btn-primary" onClick={handleProceedPayment}>
            결제 진행
          </button>
        </div>
        <button className="co-fail-backdrop" aria-label="닫기" onClick={() => setShowPolicyNotice(false)} />
      </dialog>
    )}
    {failMsg && (
      <dialog className="co-fail-dialog" open>
        <div className="co-fail-icon">✕</div>
        <h2 className="co-fail-title">결제 실패</h2>
        <p className="co-fail-msg">{failMsg}</p>
        <button className="co-fail-close btn btn-primary" onClick={() => setFailMsg('')}>
          확인
        </button>
        <button className="co-fail-backdrop" aria-label="닫기" onClick={() => setFailMsg('')} />
      </dialog>
    )}
    <div className="co-page container page-wrapper">
      <h1 className="co-title">주문 / 결제</h1>

      <div className="co-layout">
        {/* ── 좌측: 배송지 + 결제수단 ── */}
        <div className="co-left">

          {/* 주문 상품 */}
          <section className="co-section">
            <h2 className="co-section-title">주문 상품 ({items.length})</h2>
            <ul className="co-item-list">
              {items.map((item) => {
                const img = getImgSrc(item.images?.[0]);
                return (
                  <li key={item.cartId ?? item._id} className="co-item">
                    <div className="co-item-img">
                      {img && <img src={img} alt={item.name} />}
                    </div>
                    <div className="co-item-info">
                      <p className="co-item-name">{item.name}</p>
                      {(item.size || item.color) && (
                        <p className="co-item-opts">
                          {item.size && <span>{item.size}</span>}
                          {item.color && (
                            <span className="co-color-tag">
                              <span
                                className="co-color-dot"
                                style={{ background: item.color.hex }}
                              />
                              {item.color.name}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="co-item-qty">수량 {item.quantity}개</p>
                    </div>
                    <p className="co-item-price">
                      {(item.price * item.quantity).toLocaleString()}원
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 배송지 */}
          <section className="co-section">
            <h2 className="co-section-title">배송지</h2>
            <AddressForm value={addr} onChange={setAddr} showErrors={submitAttempted} />
          </section>

          {/* 결제 수단 */}
          <section className="co-section">
            <h2 className="co-section-title">결제 수단</h2>
            <div className="co-payment-methods">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`co-pay-option${paymentMethod === m.value ? ' selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.value}
                    checked={paymentMethod === m.value}
                    onChange={() => setPaymentMethod(m.value)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </section>

          {/* 약관 동의 */}
          <section className="co-section">
            <h2 className="co-section-title">약관 동의</h2>
            <label className="co-agree">
              <input
                type="checkbox"
                checked={agreeAll}
                onChange={(e) => setAgreeAll(e.target.checked)}
              />
              <span>구매조건 확인 및 결제 진행에 동의합니다 (필수)</span>
            </label>
          </section>
        </div>

        {/* ── 우측: 결제 금액 요약 ── */}
        <div className="co-right">
          <div className="co-summary">
            <h2 className="co-section-title">결제 금액</h2>
            <div className="co-summary-rows">
              <div className="co-summary-row">
                <span>상품 금액</span>
                <span>{itemsTotal.toLocaleString()}원</span>
              </div>
              <div className="co-summary-row">
                <span>배송비</span>
                <span>
                  {shippingFee === 0
                    ? <span className="co-free">무료</span>
                    : `${shippingFee.toLocaleString()}원`
                  }
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="co-shipping-notice">
                  {FREE_SHIPPING_THRESHOLD.toLocaleString()}원 이상 구매 시 무료배송
                </p>
              )}
            </div>
            <div className="co-summary-total">
              <span>최종 결제금액</span>
              <span className="co-total-price">{totalAmount.toLocaleString()}원</span>
            </div>
            <button
              className="co-submit-btn"
              onClick={handleSubmit}
              disabled={busy}
            >
              {submitLabel}
            </button>
            <p className="co-pg-notice">
              결제 버튼 클릭 시 PG사 결제창이 열립니다
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
