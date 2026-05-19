import { Link } from 'react-router-dom';
import useWishlistStore from '@/store/wishlistStore';
import './WishlistPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (src) => {
  if (!src) return null;
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();

  if (items.length === 0) {
    return (
      <div className="wishlist-page container page-wrapper">
        <div className="wishlist-page-header">
          <h1>찜목록</h1>
          <Link to="/cart" className="wishlist-cart-link">장바구니 보기</Link>
        </div>
        <p className="wishlist-empty">찜한 상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="wishlist-page container page-wrapper">
      <div className="wishlist-page-header">
        <h1>찜목록</h1>
        <Link to="/cart" className="wishlist-cart-link">장바구니 보기</Link>
      </div>

      <div className="wishlist-grid">
        {items.map((product) => {
          const imgSrc = getImgSrc(product.images?.[0]);
          const discount =
            product.originalPrice > product.price
              ? Math.round((1 - product.price / product.originalPrice) * 100)
              : null;

          return (
            <div key={product._id} className="wishlist-card">
              <Link to={`/products/${product._id}`} className="wishlist-img-link">
                <div className="wishlist-img-wrap">
                  {imgSrc ? (
                    <img src={imgSrc} alt={product.name} className="wishlist-img" />
                  ) : (
                    <div className="wishlist-img-placeholder" />
                  )}
                  {discount !== null && (
                    <span className="wishlist-discount-badge">{discount}%</span>
                  )}
                </div>
              </Link>

              <div className="wishlist-card-body">
                {product.brand && (
                  <p className="wishlist-brand">{product.brand}</p>
                )}
                <Link to={`/products/${product._id}`} className="wishlist-name">
                  {product.name}
                </Link>
                <div className="wishlist-price-row">
                  {product.originalPrice > product.price && (
                    <span className="wishlist-original-price">
                      {product.originalPrice.toLocaleString()}원
                    </span>
                  )}
                  <span className="wishlist-price">{product.price.toLocaleString()}원</span>
                </div>

                <div className="wishlist-actions">
                  <Link
                    to={`/products/${product._id}`}
                    className="wishlist-btn-cart"
                  >
                    장바구니 담기
                  </Link>
                  <button
                    className="wishlist-btn-remove"
                    onClick={() => removeItem(product._id)}
                  >
                    찜 해제
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
