import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProduct } from '@/api/products';
import { getReviews, getMyReview, upsertReview, uploadReviewImage } from '@/api/reviews';
import useCartStore from '@/store/cartStore';
import useWishlistStore from '@/store/wishlistStore';
import useAuthStore from '@/store/authStore';
import Pagination from '@/components/common/Pagination';
import './ProductDetailPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (src) => (src?.startsWith('http') ? src : `${API_URL}${src}`);
const MAX_REVIEW_IMAGES = 3;

/* ── 별점 표시 (읽기 전용) ─────────────────────────────── */
function StarRating({ value, count }) {
  return (
    <div className="pd-rating">
      <span className="pd-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`pd-star${i < Math.round(value) ? ' filled' : ''}`}>★</span>
        ))}
      </span>
      <span className="pd-rating-value">{value.toFixed(1)}</span>
      <span className="pd-rating-count">({count.toLocaleString()}개 리뷰)</span>
    </div>
  );
}
StarRating.propTypes = {
  value: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
};

/* ── 별점 선택기 (인터랙티브) ──────────────────────────── */
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="review-star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`review-star-btn${(hover || value) >= n ? ' filled' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`별점 ${n}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
StarPicker.propTypes = {
  value:    PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

/* ── 리뷰 아이템 ───────────────────────────────────────── */
function ReviewItem({ review, isOwn }) {
  const filled = Math.round(review.rating);
  return (
    <div className={`review-item${isOwn ? ' review-item--own' : ''}`}>
      <div className="review-item-header">
        <span className="review-author">{review.user?.name ?? '구매자'}</span>
        <span className="review-stars-row">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`review-star-icon${i < filled ? ' filled' : ''}`}>★</span>
          ))}
        </span>
        <span className="review-date">
          {new Date(review.createdAt).toLocaleDateString('ko-KR')}
        </span>
        {isOwn && <span className="review-own-badge">내 리뷰</span>}
      </div>
      <p className="review-content">{review.content}</p>
      {review.images?.length > 0 && (
        <div className="review-image-row">
          {review.images.map((url) => (
            <img key={url} src={url} alt="리뷰 이미지" className="review-image" />
          ))}
        </div>
      )}
    </div>
  );
}
ReviewItem.propTypes = {
  review: PropTypes.shape({
    _id:       PropTypes.string.isRequired,
    rating:    PropTypes.number.isRequired,
    content:   PropTypes.string.isRequired,
    images:    PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string.isRequired,
    user:      PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string }),
  }).isRequired,
  isOwn: PropTypes.bool,
};

/* ── 리뷰 작성/수정 폼 ─────────────────────────────────── */
function ReviewForm({ existingReview, isPending, onSubmit, onCancel }) {
  const [rating,    setRating]    = useState(existingReview?.rating  ?? 0);
  const [content,   setContent]   = useState(existingReview?.content ?? '');
  const [images,    setImages]    = useState(existingReview?.images  ?? []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFiles = async (e) => {
    const files = [...e.target.files].slice(0, MAX_REVIEW_IMAGES - images.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map((f) => uploadReviewImage(f).then((r) => r.data.url))
      );
      setImages((prev) => [...prev, ...urls]);
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating)        { alert('별점을 선택해주세요.'); return; }
    if (!content.trim()) { alert('리뷰 내용을 입력해주세요.'); return; }
    onSubmit({ rating, content, images });
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <p className="review-form-title">{existingReview ? '리뷰 수정' : '리뷰 작성'}</p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        className="review-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="구매한 상품에 대한 솔직한 리뷰를 남겨주세요. (최대 1000자)"
        rows={4}
        maxLength={1000}
        required
      />
      <div className="review-images-row">
        {images.map((url, i) => (
          <div key={url} className="review-img-wrap">
            <img src={url} alt={`리뷰 이미지 ${i + 1}`} />
            <button
              type="button"
              className="review-img-remove"
              onClick={() => setImages(images.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        {images.length < MAX_REVIEW_IMAGES && (
          <button
            type="button"
            className="review-img-add"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '업로드 중…' : '+ 사진 추가'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFiles}
        />
      </div>
      <div className="review-form-actions">
        {onCancel && (
          <button type="button" className="review-cancel-btn" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="review-submit-btn" disabled={isPending || uploading}>
          {getSubmitLabel(isPending, existingReview)}
        </button>
      </div>
    </form>
  );
}
ReviewForm.propTypes = {
  existingReview: PropTypes.object,
  isPending:      PropTypes.bool,
  onSubmit:       PropTypes.func.isRequired,
  onCancel:       PropTypes.func,
};

function getSubmitLabel(isPending, existingReview) {
  if (isPending) return '등록 중…';
  return existingReview ? '수정 완료' : '리뷰 등록';
}

/* ── 리뷰 목록 렌더링 ───────────────────────────────────── */
function ReviewsBody({ reviews, isLoading, userId }) {
  if (isLoading) return <p className="review-notice">불러오는 중…</p>;
  if (reviews.length === 0) {
    return (
      <p className="review-notice review-empty">
        아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
      </p>
    );
  }
  return (
    <div className="reviews-list">
      {reviews.map((rv) => (
        <ReviewItem key={rv._id} review={rv} isOwn={rv.user?._id === userId} />
      ))}
    </div>
  );
}
ReviewsBody.propTypes = {
  reviews:   PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  userId:    PropTypes.string,
};

/* ── 구매자 리뷰 탭 전체 ───────────────────────────────── */
function ReviewsTab({ productId }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [page,    setPage]    = useState(1);
  const [editing, setEditing] = useState(false);

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', productId, page],
    queryFn:  () => getReviews(productId, { page, limit: 5 }).then((r) => r.data),
  });

  const { data: myData } = useQuery({
    queryKey: ['my-review', productId],
    queryFn:  () => getMyReview(productId).then((r) => r.data),
    enabled:  !!user,
  });

  const reviews    = reviewsData?.reviews    ?? [];
  const total      = reviewsData?.total      ?? 0;
  const totalPages = reviewsData?.totalPages ?? 1;
  const myReview   = myData?.review   ?? null;
  const canReview  = myData?.canReview ?? false;

  const mutation = useMutation({
    mutationFn: (data) => upsertReview(productId, data).then((r) => r.data),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['reviews',   productId] });
      qc.invalidateQueries({ queryKey: ['my-review', productId] });
      qc.invalidateQueries({ queryKey: ['product',   productId] });
    },
    onError: (err) => alert(err.response?.data?.message ?? '리뷰 등록에 실패했습니다.'),
  });

  const showForm = canReview && (!myReview || editing);

  return (
    <div className="reviews-tab">
      <p className="reviews-total-label">전체 리뷰 {total}개</p>

      {/* 로그인 안 했을 때 */}
      {!user && (
        <p className="review-notice">로그인 후 리뷰를 작성할 수 있습니다.</p>
      )}

      {/* 로그인 O, 구매 X */}
      {user && myData && !canReview && (
        <p className="review-notice">해당 상품을 구매하신 후 리뷰를 작성할 수 있습니다.</p>
      )}

      {/* 로그인 O, 구매 O */}
      {user && canReview && (
        <div className="review-write-section">
          {!showForm && myReview ? (
            <div className="review-my-exists">
              <span>이미 리뷰를 작성하셨습니다.</span>
              <button type="button" className="review-edit-btn" onClick={() => setEditing(true)}>
                수정하기
              </button>
            </div>
          ) : (
            <ReviewForm
              existingReview={myReview}
              isPending={mutation.isPending}
              onSubmit={(data) => mutation.mutate(data)}
              onCancel={myReview ? () => setEditing(false) : null}
            />
          )}
        </div>
      )}

      {/* 리뷰 목록 */}
      <ReviewsBody reviews={reviews} isLoading={reviewsLoading} userId={user?._id} />

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  );
}
ReviewsTab.propTypes = {
  productId: PropTypes.string.isRequired,
};

/* ── 헬퍼 함수 ─────────────────────────────────────────── */
function getCartBtnTitle(needsSize, needsColor) {
  if (needsSize)  return '사이즈를 선택해주세요';
  if (needsColor) return '색상을 선택해주세요';
  return '';
}

function calcDiscount(originalPrice, price) {
  if (originalPrice > price) {
    return Math.round((1 - price / originalPrice) * 100);
  }
  return null;
}

function getCartBtnLabel(stock, price, quantity) {
  if (stock === 0) return '품절';
  return `장바구니 담기 · ${(price * quantity).toLocaleString()}원`;
}

/* ── 메인 컴포넌트 ─────────────────────────────────────── */
export default function ProductDetailPage() {
  const { id } = useParams();
  const addItem      = useCartStore((s) => s.addItem);
  const toggleItem   = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);

  const [selectedSize,  setSelectedSize]  = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity,      setQuantity]      = useState(1);
  const [currentImg,    setCurrentImg]    = useState(0);
  const [activeTab,     setActiveTab]     = useState('detail');
  const timerRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn:  () => getProduct(id).then((r) => r.data),
  });

  const product      = data?.product;
  const images       = (product?.images       ?? []).map(getImgSrc).filter(Boolean);
  const detailImages = (product?.detailImages  ?? []).map(getImgSrc).filter(Boolean);

  const startTimer = (len) => {
    clearInterval(timerRef.current);
    if (len <= 1) return;
    timerRef.current = setInterval(() => setCurrentImg((i) => (i + 1) % len), 3000);
  };

  useEffect(() => {
    startTimer(images.length);
    return () => clearInterval(timerRef.current);
  }, [images.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    setCurrentImg(0);
    setActiveTab('detail');
  }, [id]);

  if (isLoading) return <p className="loading-text container">불러오는 중...</p>;
  if (!product)  return <p className="loading-text container">상품을 찾을 수 없습니다.</p>;

  const sizes      = product.sizes  ?? [];
  const colors     = product.colors ?? [];
  const avgRating  = product.ratings?.average ?? 0;
  const ratingCount = product.ratings?.count  ?? 0;
  const inWishlist  = isInWishlist(product._id);

  const discount     = calcDiscount(product.originalPrice, product.price);
  const needsSize    = sizes.length  > 0 && !selectedSize;
  const needsColor   = colors.length > 0 && !selectedColor;
  const canAdd       = product.stock > 0 && !needsSize && !needsColor;
  const cartBtnLabel = getCartBtnLabel(product.stock, product.price, quantity);

  const handleAddToCart = () =>
    addItem({ ...product, size: selectedSize, color: selectedColor }, quantity);

  const handleThumbClick = (i) => {
    setCurrentImg(i);
    startTimer(images.length);
  };

  return (
    <div>
      {/* ── 상품 기본 정보 (이미지 + 옵션) ──────────────── */}
      <div className="product-detail container">
        {/* 이미지 캐러셀 */}
        <div className="product-detail-image-area">
          <div className="product-detail-main-img">
            {images.length > 0
              ? <img src={images[currentImg]} alt={product.name} />
              : <span className="product-detail-no-image">이미지 준비중</span>
            }
            {images.length > 1 && (
              <div className="pd-img-dots">
                {images.map((src, i) => (
                  <span key={src} className={`pd-img-dot${i === currentImg ? ' active' : ''}`} />
                ))}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="product-detail-thumbs">
              {images.map((src, i) => (
                <button
                  key={src}
                  className={`product-detail-thumb${i === currentImg ? ' active' : ''}`}
                  onClick={() => handleThumbClick(i)}
                  aria-label={`이미지 ${i + 1}`}
                >
                  <img src={src} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="product-detail-info">
          {(product.isNew || product.isSale) && (
            <div className="pd-badges">
              {product.isNew  && <span className="pd-badge pd-badge--new">NEW</span>}
              {product.isSale && <span className="pd-badge pd-badge--sale">SALE</span>}
            </div>
          )}

          {product.brand && <p className="product-detail-brand">{product.brand}</p>}
          <h1 className="product-detail-name">{product.name}</h1>

          {avgRating > 0 && <StarRating value={avgRating} count={ratingCount} />}

          <hr className="pd-divider" />

          <div className="pd-price-row">
            <span className="pd-price">{product.price.toLocaleString()}원</span>
            {product.originalPrice > product.price && (
              <>
                <span className="pd-original">{product.originalPrice.toLocaleString()}원</span>
                {!!discount && <span className="pd-discount">{discount}% OFF</span>}
              </>
            )}
          </div>

          <hr className="pd-divider" />

          {sizes.length > 0 && (
            <div className="pd-section">
              <p className="pd-section-label">사이즈</p>
              <div className="pd-sizes">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`pd-size-btn${selectedSize === sz ? ' active' : ''}`}
                    onClick={() => setSelectedSize(sz === selectedSize ? null : sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="pd-section">
              <p className="pd-section-label">
                색상{selectedColor ? `: ${selectedColor.name}` : ''}
              </p>
              <div className="pd-colors">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`pd-color-btn${selectedColor?.name === c.name ? ' active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setSelectedColor(selectedColor?.name === c.name ? null : c)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pd-section">
            <p className="pd-section-label">수량</p>
            <div className="pd-qty-row">
              <div className="pd-qty">
                <button type="button" className="pd-qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span className="pd-qty-value">{quantity}</span>
                <button type="button" className="pd-qty-btn" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <span className={`pd-stock${product.stock === 0 ? ' out' : ''}`}>
                {product.stock === 0 ? '품절' : `재고 ${product.stock}개 남음`}
              </span>
            </div>
          </div>

          {!!product.description && (
            <p className="product-detail-desc">{product.description}</p>
          )}

          <div className="pd-actions">
            <button
              className="btn btn-primary product-detail-btn"
              onClick={handleAddToCart}
              disabled={!canAdd}
              title={getCartBtnTitle(needsSize, needsColor)}
            >
              {cartBtnLabel}
            </button>
            <button
              className={`product-detail-wish-btn${inWishlist ? ' active' : ''}`}
              onClick={() => toggleItem(product)}
            >
              {inWishlist ? '♥ 찜 목록에서 제거' : '♡ 찜 목록에 추가'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 하단 탭 (상세설명 / 리뷰) ────────────────────── */}
      <div className="pd-tabs-section">
        <nav className="pd-tabs-nav">
          <div className="container pd-tabs-nav-inner">
            <button
              type="button"
              className={`pd-tab-btn${activeTab === 'detail' ? ' active' : ''}`}
              onClick={() => setActiveTab('detail')}
            >
              상품 상세설명
            </button>
            <button
              type="button"
              className={`pd-tab-btn${activeTab === 'reviews' ? ' active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              구매자 리뷰
              {ratingCount > 0 && <span className="pd-tab-count">{ratingCount}</span>}
            </button>
          </div>
        </nav>

        <div className="pd-tab-body container">
          {activeTab === 'detail' && (
            <div className="pd-detail-tab">
              {detailImages.length > 0 ? (
                detailImages.map((src) => (
                  <img key={src} src={src} alt="상품 상세" className="pd-detail-img" />
                ))
              ) : (
                !product.description && (
                  <p className="pd-detail-empty">등록된 상세 설명이 없습니다.</p>
                )
              )}
              {!!product.description && (
                <p className="pd-detail-text">{product.description}</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && <ReviewsTab productId={id} />}
        </div>
      </div>
    </div>
  );
}
