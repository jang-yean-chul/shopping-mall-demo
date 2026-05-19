import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetProducts, adminCreateProduct, adminUpdateProduct,
  adminDeleteProduct, getImageUrl, adminGetUploadSignature,
} from '@/api/admin';
import Pagination from '@/components/common/Pagination';

const CATEGORIES = ['top', 'bottom', 'outer', 'dress', 'bag', 'shoes', 'acc', 'outlet'];
const CAT_LABEL  = { top: '상의', bottom: '하의', outer: '아우터', dress: '원피스', bag: '가방', shoes: '신발', acc: '액세서리', outlet: '아울렛' };
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'Free', '44', '55', '66', '77', '88'];
const MAX_IMAGES = 6;
const MAX_DETAIL_IMAGES = 10;

const IS_NEW_MS = 7 * 24 * 60 * 60 * 1000;
const isNewProduct = (p) => p.createdAt && Date.now() - new Date(p.createdAt).getTime() < IS_NEW_MS;

const SKU_CAT = { top: 'TOP', bottom: 'BOT', outer: 'OUT', dress: 'DRS', bag: 'BAG', shoes: 'SHO', acc: 'ACC', outlet: 'OTL' };
const previewSku = (category, brand) => {
  const cat  = SKU_CAT[category] ?? (category || 'GEN').slice(0, 3).toUpperCase();
  const br   = brand ? brand.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'GEN' : 'GEN';
  const rand = String(Math.floor(Math.random() * 90000) + 10000);
  return `${cat}-${br}-${rand}`;
};

const EMPTY_FORM = {
  name: '', brand: '', category: '', price: '', originalPrice: '',
  stock: '', description: '', images: [], detailImages: [], sku: '',
  sizes: [], colors: [], isNew: false, isSale: false,
};

function ProductModal({ initial, onClose, onSave, isPending }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const setFormRef = useRef(null);
  setFormRef.current = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const set = (k, v) => setFormRef.current(k, v);

  const appendImageRef = useRef(null);
  appendImageRef.current = (url) => setForm((f) => ({ ...f, images: [...(f.images ?? []), url] }));

  const appendDetailImageRef = useRef(null);
  appendDetailImageRef.current = (url) => setForm((f) => ({ ...f, detailImages: [...(f.detailImages ?? []), url] }));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCloudinaryWidget = (appendRef, remaining) => {
    if (!globalThis.cloudinary) {
      alert('Cloudinary 위젯을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    globalThis.cloudinary.openUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
        uploadSignature: async (callback, paramsToSign) => {
          try {
            const { data } = await adminGetUploadSignature(paramsToSign);
            callback(data.signature);
          } catch {
            alert('서명 요청에 실패했습니다.');
          }
        },
        folder: 'shopping-mall',
        sources: ['local', 'camera'],
        multiple: remaining > 1,
        maxFiles: remaining,
        maxFileSize: 5_000_000,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        styles: { palette: { window: '#FFFFFF', windowBorder: '#E0E0E0', tabIcon: '#1a1a1a', menuIcons: '#555', textDark: '#1a1a1a', textLight: '#FFFFFF', link: '#1a1a1a', action: '#1a1a1a', inactiveTabIcon: '#888', error: '#C62828', inProgress: '#1a1a1a', complete: '#2E7D32', sourceBg: '#FAFAFA' } },
      },
      (error, result) => {
        if (error) { alert(`업로드 오류: ${error.message ?? error.statusText ?? '알 수 없는 오류'}`); return; }
        if (result?.event === 'success') appendRef.current(result.info.secure_url);
      }
    );
  };

  const openWidget       = () => openCloudinaryWidget(appendImageRef,       MAX_IMAGES - form.images.length);
  const openDetailWidget = () => openCloudinaryWidget(appendDetailImageRef, MAX_DETAIL_IMAGES - form.detailImages.length);

  const toggleSize = (sz) => {
    const next = form.sizes.includes(sz) ? form.sizes.filter((s) => s !== sz) : [...form.sizes, sz];
    set('sizes', next);
  };

  const updateColor = (i, field, value) => {
    const next = [...form.colors];
    next[i] = { ...next[i], [field]: value };
    set('colors', next);
  };

  const removeColor = (i) => set('colors', form.colors.filter((_, j) => j !== i));
  const addColor = () => set('colors', [...form.colors, { name: '', hex: '#000000' }]);
  const removeImage       = (i) => set('images',       form.images.filter((_, j) => j !== i));
  const removeDetailImage = (i) => set('detailImages', form.detailImages.filter((_, j) => j !== i));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      stock: Number(form.stock),
    });
  };

  return (
    <dialog open className="admin-modal-wrap">
      <div className="admin-modal-dialog">
        <div className="admin-modal">
          <div className="admin-modal-hd">
            <h2 className="admin-modal-title">{initial ? '상품 수정' : '상품 등록'}</h2>
            <button type="button" className="admin-modal-close" onClick={onClose} aria-label="닫기">×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">

              {/* 이미지 (최대 6장) */}
              <div className="admin-form-field span2">
                <span className="admin-form-label">상품 이미지 (최대 {MAX_IMAGES}장)</span>
                <div className="admin-images-area">
                  {form.images.map((url, i) => (
                    <div key={url} className="admin-image-preview">
                      <img src={getImageUrl(url)} alt={`이미지 ${i + 1}`} />
                      <button type="button" className="admin-image-remove" onClick={() => removeImage(i)}>×</button>
                    </div>
                  ))}
                  {form.images.length < MAX_IMAGES && (
                    <button type="button" className="admin-image-upload" onClick={openWidget}>
                      +<br />이미지 추가
                    </button>
                  )}
                </div>
              </div>

              {/* 상세 설명 이미지 (최대 10장) */}
              <div className="admin-form-field span2">
                <span className="admin-form-label">상세 설명 이미지 (최대 {MAX_DETAIL_IMAGES}장)</span>
                <div className="admin-images-area">
                  {form.detailImages.map((url, i) => (
                    <div key={url} className="admin-image-preview">
                      <img src={getImageUrl(url)} alt={`상세 이미지 ${i + 1}`} />
                      <button type="button" className="admin-image-remove" onClick={() => removeDetailImage(i)}>×</button>
                    </div>
                  ))}
                  {form.detailImages.length < MAX_DETAIL_IMAGES && (
                    <button type="button" className="admin-image-upload" onClick={openDetailWidget}>
                      +<br />이미지 추가
                    </button>
                  )}
                </div>
                <span className="admin-form-hint">상품 상세 페이지 하단 &ldquo;상품 상세설명&rdquo; 탭에 순서대로 표시됩니다.</span>
              </div>

              {/* SKU */}
              <div className="admin-form-field span2">
                <label className="admin-form-label" htmlFor="prod-sku">SKU</label>
                <div className="admin-sku-row">
                  <input
                    id="prod-sku"
                    className="admin-form-input admin-sku-input"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value.toUpperCase())}
                    placeholder="비워두면 자동 생성"
                    maxLength={30}
                  />
                  <button type="button" className="admin-btn admin-btn--outline" onClick={() => set('sku', previewSku(form.category, form.brand))}>
                    자동 생성
                  </button>
                </div>
                <span className="admin-form-hint">형식: 카테고리-브랜드-번호 (예: TOP-NIK-20490) · 비워두면 저장 시 자동 발급</span>
              </div>

              {/* 상품명 */}
              <div className="admin-form-field span2">
                <label className="admin-form-label" htmlFor="prod-name">상품명 *</label>
                <input id="prod-name" className="admin-form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>

              {/* 브랜드 / 카테고리 */}
              <div className="admin-form-field">
                <label className="admin-form-label" htmlFor="prod-brand">브랜드</label>
                <input id="prod-brand" className="admin-form-input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label" htmlFor="prod-category">카테고리 *</label>
                <select id="prod-category" className="admin-form-input" value={form.category} onChange={(e) => set('category', e.target.value)} required>
                  <option value="">선택</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                </select>
              </div>

              {/* 판매가 / 원가 */}
              <div className="admin-form-field">
                <label className="admin-form-label" htmlFor="prod-price">판매가 *</label>
                <input id="prod-price" className="admin-form-input" type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} required />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label" htmlFor="prod-original-price">원가 (할인 전)</label>
                <input id="prod-original-price" className="admin-form-input" type="number" min="0" value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} />
              </div>

              {/* 재고 */}
              <div className="admin-form-field">
                <label className="admin-form-label" htmlFor="prod-stock">재고 *</label>
                <input id="prod-stock" className="admin-form-input" type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
              </div>

              {/* 뱃지 */}
              <div className="admin-form-field">
                <span className="admin-form-label">뱃지</span>
                <div className="admin-checkbox-group">
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={!!form.isNew} onChange={(e) => set('isNew', e.target.checked)} />{' '}NEW
                  </label>
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={!!form.isSale} onChange={(e) => set('isSale', e.target.checked)} />{' '}SALE
                  </label>
                </div>
              </div>

              {/* 사이즈 */}
              <div className="admin-form-field span2">
                <span className="admin-form-label">사이즈</span>
                <div className="admin-size-tags">
                  {SIZE_OPTIONS.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`admin-size-tag${form.sizes.includes(sz) ? ' active' : ''}`}
                      onClick={() => toggleSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* 색상 */}
              <div className="admin-form-field span2">
                <div className="admin-form-label-row">
                  <span className="admin-form-label">색상</span>
                  <button type="button" className="admin-btn admin-btn--outline" onClick={addColor}>+ 색상 추가</button>
                </div>
                {form.colors.length > 0 && (
                  <div className="admin-color-rows">
                    {form.colors.map((c, i) => (
                      <div key={i} className="admin-color-row"> {/* eslint-disable-line react/no-array-index-key */}
                        <input
                          className="admin-form-input admin-color-name-input"
                          placeholder="색상명 (예: 블루)"
                          value={c.name}
                          onChange={(e) => updateColor(i, 'name', e.target.value)}
                        />
                        <input
                          type="color"
                          className="admin-color-hex"
                          value={c.hex}
                          onChange={(e) => updateColor(i, 'hex', e.target.value)}
                        />
                        <button type="button" className="admin-btn admin-btn--danger" onClick={() => removeColor(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 설명 */}
              <div className="admin-form-field span2">
                <label className="admin-form-label" htmlFor="prod-desc">설명</label>
                <textarea id="prod-desc" className="admin-form-input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={isPending}>
                {isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}

ProductModal.propTypes = {
  initial:   PropTypes.object,
  onClose:   PropTypes.func.isRequired,
  onSave:    PropTypes.func.isRequired,
  isPending: PropTypes.bool,
};

const LIMIT = 10;

export default function AdminProducts() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => adminGetProducts({ page, limit: LIMIT, search: search || undefined }).then((r) => r.data),
  });
  const products   = data?.products ?? [];
  const total      = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['products'] });
  };

  const createMutation = useMutation({
    mutationFn: adminCreateProduct,
    onSuccess: () => { invalidate(); setModal(null); },
    onError: (err) => alert(`등록 실패: ${err.response?.data?.message ?? err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }) => adminUpdateProduct(id, d),
    onSuccess: () => { invalidate(); setModal(null); },
    onError: (err) => alert(`수정 실패: ${err.response?.data?.message ?? err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteProduct,
    onSuccess: invalidate,
    onError: (err) => alert(`삭제 실패: ${err.response?.data?.message ?? err.message}`),
  });

  const handleSave = (formData) => {
    if (modal.mode === 'create') {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate({ id: modal.product._id, data: formData });
    }
  };

  const handleDelete = (product) => {
    if (globalThis.confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(product._id);
    }
  };

  const openEdit = (product) => setModal({
    mode: 'edit',
    product,
    initial: {
      name: product.name,
      brand: product.brand ?? '',
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice ?? '',
      stock: product.stock,
      description: product.description ?? '',
      images: product.images ?? [],
      detailImages: product.detailImages ?? [],
      sku: product.sku ?? '',
      sizes: product.sizes ?? [],
      colors: product.colors ?? [],
      isNew: product.isNew ?? false,
      isSale: product.isSale ?? false,
    },
  });

  const renderTable = () => {
    if (isLoading) return <p className="admin-loading">불러오는 중...</p>;
    if (products.length === 0) return <p className="admin-empty">등록된 상품이 없습니다.</p>;
    return (
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>이미지</th>
            <th>상품명</th>
            <th>SKU</th>
            <th>브랜드</th>
            <th>카테고리</th>
            <th>판매가</th>
            <th>재고</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>
                {p.images?.[0]
                  ? <img src={getImageUrl(p.images[0])} alt={p.name} className="admin-product-thumb" />
                  : <div className="admin-product-thumb-empty">🖼</div>
                }
              </td>
              <td>
                {p.name}
                {isNewProduct(p) && <span className="admin-badge admin-badge--confirmed" style={{ marginLeft: 6 }}>NEW</span>}
                {p.isSale && <span className="admin-badge admin-badge--cancelled" style={{ marginLeft: 4 }}>SALE</span>}
              </td>
              <td>
                {p.sku
                  ? <code className="admin-sku-cell">{p.sku}</code>
                  : <span style={{ color: '#bbb', fontSize: 11 }}>미발급</span>
                }
              </td>
              <td>{p.brand ?? '-'}</td>
              <td>{CAT_LABEL[p.category] ?? p.category}</td>
              <td>{p.price.toLocaleString()}원</td>
              <td>{p.stock}</td>
              <td>
                <span className={`admin-badge ${p.isActive ? 'admin-badge--active' : 'admin-badge--inactive'}`}>
                  {p.isActive ? '판매중' : '숨김'}
                </span>
              </td>
              <td>
                <div className="admin-action-btns">
                  <button className="admin-btn admin-btn--outline" onClick={() => openEdit(p)}>수정</button>
                  <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(p)}>삭제</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <h1 className="admin-page-title">상품 관리</h1>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-title">상품 목록 ({total}건)</span>
          <div className="admin-table-header-actions">
            <form
              className="admin-search-form"
              onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
            >
              <input
                className="admin-search-input"
                placeholder="상품명 · SKU 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="admin-btn admin-btn--primary">검색</button>
              {search && (
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                >
                  초기화
                </button>
              )}
            </form>
            <button className="admin-btn admin-btn--primary" onClick={() => setModal({ mode: 'create' })}>+ 상품 등록</button>
          </div>
        </div>
        {renderTable()}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {modal && (
        <ProductModal
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSave={handleSave}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
