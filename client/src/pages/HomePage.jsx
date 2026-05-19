import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/products';
import './HomePage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (src) => (src?.startsWith('http') ? src : `${API_URL}${src}`);

function ProductCard({ product }) {
  const [imgIdx, setImgIdx] = useState(0);
  const intervalRef = useRef(null);
  const images = product.images?.map((s) => getImgSrc(s)) ?? [];
  const hasMultiple = images.length > 1;

  const startSlide = () => {
    if (!hasMultiple) return;
    intervalRef.current = setInterval(
      () => setImgIdx((i) => (i + 1) % images.length),
      1200,
    );
  };

  const stopSlide = () => {
    clearInterval(intervalRef.current);
    setImgIdx(0);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const currentSrc = images[imgIdx] ?? null;

  return (
    <div className="product-card">
      <Link
        to={`/products/${product._id}`}
        onMouseEnter={startSlide}
        onMouseLeave={stopSlide}
      >
        <div className="product-card-img-wrap">
          {currentSrc
            ? <img key={imgIdx} src={currentSrc} alt={product.name} />
            : <div className="product-card-img-placeholder">이미지 준비중</div>
          }
          {product.isNew && <span className="product-card-badge">NEW</span>}
          {hasMultiple && (
            <div className="product-img-dots">
              {images.map((url, i) => (
                <span key={url} className={`product-img-dot${i === imgIdx ? ' active' : ''}`} />
              ))}
            </div>
          )}
        </div>
        <div className="product-card-info">
          {product.brand && <p className="product-card-brand">{product.brand}</p>}
          <p className="product-card-name">{product.name}</p>
          <div className="product-card-price-wrap">
            <span className="product-card-price">{product.price.toLocaleString()}원</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id:    PropTypes.string.isRequired,
    name:   PropTypes.string.isRequired,
    price:  PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    brand:  PropTypes.string,
    isNew:  PropTypes.bool,
  }).isRequired,
};

function ProductSection({ title, link, products, isLoading }) {
  const renderContent = () => {
    if (isLoading) return <p className="loading-text">불러오는 중...</p>;
    if (!products?.length) return <p className="home-empty">등록된 상품이 없습니다.</p>;
    return (
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <section>
      <div className="section-header">
        <h3 className="section-title">{title}</h3>
        <Link to={link} className="section-more">더보기 &rsaquo;</Link>
      </div>
      {renderContent()}
    </section>
  );
}

ProductSection.propTypes = {
  title:     PropTypes.string.isRequired,
  link:      PropTypes.string.isRequired,
  products:  PropTypes.array,
  isLoading: PropTypes.bool,
};

export default function HomePage() {
  const { data: newData, isLoading: newLoading } = useQuery({
    queryKey: ['products', 'new'],
    queryFn: () => getProducts({ sort: '-createdAt', limit: 8 }).then((r) => r.data),
  });

  const { data: popularData, isLoading: popularLoading } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => getProducts({ sort: '-ratings.count', limit: 8 }).then((r) => r.data),
  });

  return (
    <div>
      {/* 히어로 배너 */}
      <div className="home-banner">
        <div className="home-banner-content">
          <p className="home-banner-eyebrow">2025 Summer Collection</p>
          <h2>NEW ARRIVALS</h2>
          <p>새로운 시즌의 시작, 지금 만나보세요</p>
          <div className="home-banner-actions">
            <Link to="/products" className="home-banner-btn-main">신상품 보기</Link>
            <Link to="/products?category=outlet" className="home-banner-btn-sub">아울렛 &rsaquo;</Link>
          </div>
        </div>
      </div>

      <div className="container">
        <ProductSection
          title="신상품"
          link="/products?sort=-createdAt"
          products={newData?.products}
          isLoading={newLoading}
        />
        <ProductSection
          title="인기상품"
          link="/products?sort=-ratings.count"
          products={popularData?.products}
          isLoading={popularLoading}
        />
      </div>
    </div>
  );
}
