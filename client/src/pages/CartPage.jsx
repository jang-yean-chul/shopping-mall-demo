import { useNavigate } from 'react-router-dom';
import useCartStore from '@/store/cartStore';
import './CartPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (src) => {
  if (!src) return null;
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const navigate = useNavigate();

  const itemsTotal  = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingFee = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const totalAmount = itemsTotal + shippingFee;

  if (items.length === 0) {
    return <p className="cart-empty container page-wrapper">장바구니가 비었습니다.</p>;
  }

  return (
    <div className="cart-page container page-wrapper">
      <h1>장바구니</h1>
      <div className="cart-list">
        {items.map((item) => {
          const itemKey = item.cartId ?? item._id;
          const imgSrc  = getImgSrc(item.images?.[0]);
          return (
            <div key={itemKey} className="card cart-item">
              <div className="cart-item-image">
                {imgSrc && <img src={imgSrc} alt={item.name} className="cart-item-img" />}
              </div>
              <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>
                {(item.size || item.color) && (
                  <p className="cart-item-options">
                    {item.size && <span className="cart-option-tag">{item.size}</span>}
                    {item.color && (
                      <span className="cart-option-color-wrap">
                        <span className="cart-option-color-dot" style={{ background: item.color.hex }} />
                        <span>{item.color.name}</span>
                      </span>
                    )}
                  </p>
                )}
                <p className="cart-item-price">{item.price.toLocaleString()}원</p>
              </div>
              <div className="cart-quantity">
                <button className="cart-qty-btn" onClick={() => updateQuantity(itemKey, item.quantity - 1)}>-</button>
                <span className="cart-qty-value">{item.quantity}</span>
                <button className="cart-qty-btn" onClick={() => updateQuantity(itemKey, item.quantity + 1)}>+</button>
              </div>
              <button className="cart-remove-btn" onClick={() => removeItem(itemKey)}>삭제</button>
            </div>
          );
        })}
      </div>

      <div className="card cart-summary">
        <div className="cart-fee-rows">
          <div className="cart-fee-row">
            <span>상품 금액</span>
            <span>{itemsTotal.toLocaleString()}원</span>
          </div>
          <div className="cart-fee-row">
            <span>배송비</span>
            <span>
              {shippingFee === 0
                ? <span className="cart-free-shipping">무료</span>
                : `${shippingFee.toLocaleString()}원`
              }
            </span>
          </div>
          {shippingFee > 0 && (
            <p className="cart-shipping-notice">
              {FREE_SHIPPING_THRESHOLD.toLocaleString()}원 이상 구매 시 무료배송
            </p>
          )}
        </div>
        <div className="cart-total">
          <span>합계</span>
          <span>{totalAmount.toLocaleString()}원</span>
        </div>
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/checkout')}
        >
          주문하기
        </button>
      </div>
    </div>
  );
}
