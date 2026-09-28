import { useMemo, type CSSProperties } from 'react';

export interface PaginationProps {
  /** 1-indexed current page (can also pass curPage) */
  currentPage?: number;
  curPage?: number;
  /** Total number of records (can also pass total) */
  totalItems?: number;
  total?: number;
  /** Number of items per page (default 8) */
  pageSize?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  setPage?: (page: number) => void;
  /** Optional start and end for "Showing X to Y of Z" (calculated automatically if omitted) */
  rangeStart?: number;
  rangeEnd?: number;
  /** Whether to show summary text (default true) */
  showSummary?: boolean;
  /** Optional callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Page size options in dropdown */
  pageSizeOptions?: number[];
  /** Optional container style */
  style?: CSSProperties;
  /** Optional container className */
  className?: string;
}

/**
 * Universal Pagination component matching Grid.js markup and Aurora theme CSS tokens.
 * Uses exact classes: ax-card__footer, ax-flex, ax-pagination__summary, ax-pagination,
 * ax-pagination__prev, ax-pagination__pages, ax-pagination__page, is-active, ax-pagination__next.
 */
export function Pagination({
  currentPage,
  curPage,
  totalItems,
  total,
  pageSize = 8,
  onPageChange,
  setPage,
  rangeStart,
  rangeEnd,
  showSummary = true,
  onPageSizeChange,
  pageSizeOptions,
  style,
  className = '',
}: PaginationProps) {
  // Resolve unified page number
  const page = curPage ?? currentPage ?? 1;
  const count = total ?? totalItems ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const activePage = Math.max(1, Math.min(page, totalPages));

  // Range calculation matching Grid.js
  const start = (activePage - 1) * pageSize;
  const calculatedRangeStart = count ? start + 1 : 0;
  const calculatedRangeEnd = Math.min(activePage * pageSize, count);
  const actualRangeStart = rangeStart !== undefined ? rangeStart : calculatedRangeStart;
  const actualRangeEnd = rangeEnd !== undefined ? rangeEnd : calculatedRangeEnd;

  const handlePage = (p: number) => {
    const target = Math.max(1, Math.min(p, totalPages));
    if (setPage) setPage(target);
    else if (onPageChange) onPageChange(target);
  };

  // Smart page numbers array (with ellipsis if large page count)
  const pagesList = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    const s = Math.max(2, activePage - 1);
    const e = Math.min(totalPages - 1, activePage + 1);
    if (s > 2) pages.push('ellipsis');
    for (let i = s; i <= e; i++) pages.push(i);
    if (e < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [totalPages, activePage]);

  return (
    <div
      className={`ax-card__footer ax-flex ${className}`.trim()}
      style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--ax-space-3)',
        borderTop: 'none',
        padding: 0,
        ...style,
      }}
    >
      {/* Summary + optional Page Size */}
      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        {showSummary && (
          <span className="ax-pagination__summary ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)' }}>
            Showing {actualRangeStart} to {actualRangeEnd} of {count}
          </span>
        )}

        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && (
          <label className="ax-cluster" style={{ gap: 'var(--ax-space-1)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
            <span>Rows:</span>
            <select
              className="ax-input ax-input--sm"
              value={pageSize}
              onChange={(e) => {
                const s = Number(e.target.value);
                onPageSizeChange(s);
                handlePage(1);
              }}
              style={{ width: 'auto', padding: '2px 8px', height: 28, fontSize: 'var(--ax-text-xs)' }}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Grid.js Navigation */}
      <nav className="ax-pagination" aria-label="Pagination">
        <button
          type="button"
          className="ax-pagination__prev"
          disabled={activePage === 1}
          aria-disabled={activePage === 1}
          onClick={() => handlePage(activePage - 1)}
          aria-label="Previous page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>

        <ul className="ax-pagination__pages">
          {pagesList.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <li key={`ell-${idx}`} aria-hidden="true">
                  <span className="ax-pagination__ellipsis" style={{ padding: '0 6px', color: 'var(--ax-text-subtle)' }}>…</span>
                </li>
              );
            }
            return (
              <li key={p}>
                <button
                  type="button"
                  className={`ax-pagination__page${activePage === p ? ' is-active' : ''}`}
                  aria-current={activePage === p ? 'page' : undefined}
                  onClick={() => handlePage(p)}
                >
                  {p}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="ax-pagination__next"
          disabled={activePage === totalPages}
          aria-disabled={activePage === totalPages}
          onClick={() => handlePage(activePage + 1)}
          aria-label="Next page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6l-6 6" />
          </svg>
        </button>
      </nav>
    </div>
  );
}

export default Pagination;
