import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/products';
import useCartStore from '@/store/cartStore';
import Pagination from '@/components/common/Pagination';
import './ProductsPage.css';

const LIMIT = 10;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (src) => (src?.startsWith('http') ? src : `${API_URL}${src}`);

const CATEGORY_LABEL = {
  '':       '전체 상품',
  top:      '상의',
  bottom:   '하의',
  outer:    '아우터',
  dress:    '원피스',
  bag:      '가방',
  shoes:    '신발',
  acc:      '액세서리',
  outlet:   '아울렛',
};

function ProductCard({ product, onAddCart }) {
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
    <div className="card product-card">
      <Link
        to={`/products/${product._id}`}
        onMouseEnter={startSlide}
        onMouseLeave={stopSlide}
      >
        <div className="product-card-image">
          {currentSrc
            ? <img key={imgIdx} src={currentSrc} alt={product.name} />
            : <span className="product-card-no-image">이미지 준비중</span>
          }
          {hasMultiple && (
            <div className="product-img-dots">
              {images.map((url, i) => (
                <span key={url} className={`product-img-dot${i === imgIdx ? ' active' : ''}`} />
              ))}
            </div>
          )}
        </div>
        <div className="product-card-body">
          {product.brand && <p className="product-card-brand">{product.brand}</p>}
          <p className="product-card-name">{product.name}</p>
          <div className="product-card-prices">
            {product.originalPrice && (
              <span className="product-card-original">{product.originalPrice.toLocaleString()}원</span>
            )}
            <p className="product-card-price">{product.price.toLocaleString()}원</p>
          </div>
        </div>
      </Link>
      <div className="product-card-footer">
        <button
          className="btn btn-primary btn-full btn-sm"
          onClick={() => onAddCart(product)}
        >
          장바구니 담기
        </button>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id:           PropTypes.string.isRequired,
    name:          PropTypes.string.isRequired,
    price:         PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    brand:         PropTypes.string,
    images:        PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onAddCart: PropTypes.func.isRequired,
};

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const search   = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const addItem  = useCartStore((s) => s.addItem);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, category]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', { search, category, page }],
    queryFn: () => {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (category) params.category = category;
      return getProducts(params).then((r) => r.data);
    },
  });

  const products   = data?.products ?? [];
  const totalPages = data?.totalPages ?? 1;

  const pageTitle = search
    ? `"${search}" 검색 결과`
    : CATEGORY_LABEL[category] ?? '전체 상품';

  return (
    <div className="container page-wrapper">
      <div className="products-header">
        <h2 className="products-title">{pageTitle}</h2>
        {data?.total != null && (
          <span className="products-count">{data.total}개 상품</span>
        )}
      </div>
      {isLoading && <p className="loading-text">불러오는 중...</p>}
      {!isLoading && products.length > 0 && (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} onAddCart={addItem} />
          ))}
        </div>
      )}
      {!isLoading && isError && <p className="empty-text">상품을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>}
      {!isLoading && !isError && products.length === 0 && <p className="empty-text">상품이 없습니다.</p>}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
