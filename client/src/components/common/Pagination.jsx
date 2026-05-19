import PropTypes from 'prop-types';
import './Pagination.css';


export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const buildPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages));
    return Array.from(set).sort((a, b) => a - b);
  };

  const pages = buildPages();
  const items = [];

  pages.forEach((p, i) => {
    if (i > 0 && pages[i] - pages[i - 1] > 1) {
      items.push(<span key={`dot-${p}`} className="pagination-ellipsis">…</span>);
    }
    items.push(
      <button
        key={p}
        className={`pagination-btn${p === page ? ' active' : ''}`}
        onClick={() => onChange(p)}
        aria-current={p === page ? 'page' : undefined}
      >
        {p}
      </button>
    );
  });

  return (
    <nav className="pagination" aria-label="페이지 이동">
      <button className="pagination-btn pagination-arrow" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="이전">‹</button>
      {items}
      <button className="pagination-btn pagination-arrow" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="다음">›</button>
    </nav>
  );
}

Pagination.propTypes = {
  page:       PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onChange:   PropTypes.func.isRequired,
};
