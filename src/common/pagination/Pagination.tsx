

const CHEV_L = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 6l-6 6l6 6" />
  </svg>
);

const CHEV_R = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6l-6 6" />
  </svg>
);

const CHEV_FIRST = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 7l-5 5l5 5" />
    <path d="M17 7l-5 5l5 5" />
  </svg>
);

const CHEV_LAST = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 7l5 5l-5 5" />
    <path d="M13 7l5 5l-5 5" />
  </svg>
);

export interface PaginationProps {
  /** 1-indexed current page */
  currentPage: number;
  /** Total number of records */
  totalItems: number;
  /** Number of items per page */
  pageSize: number;
  /** Callback when page changes (receives 1-indexed page) */
  onPageChange: (page: number) => void;
  /** Optional callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Page size options in dropdown */
  pageSizeOptions?: number[];
  /** Whether to show "Showing X-Y of Z" */
  showSummary?: boolean;
  /** Whether to show page size selector */
  showPageSize?: boolean;
  /** Whether to show first/last page jump buttons */
  showFirstLast?: boolean;
  /** Optional container className */
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
  showSummary = true,
  showPageSize = true,
  showFirstLast = true,
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);

  const goToPage = (p: number) => {
    const target = Math.max(1, Math.min(p, totalPages));
    if (target !== safePage) {
      onPageChange(target);
    }
  };

  // Build visible page numbers with smart ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    if (start > 2) {
      pages.push('ellipsis');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`ax-pagination-wrapper flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-1 ${className}`}
      aria-label="Table pagination navigation"
    >
      {/* Left side: Summary + Page size dropdown */}
      <div className="flex items-center gap-4 flex-wrap text-sm text-slate-500">
        {showSummary && (
          <span className="ax-pagination__summary ax-num text-xs sm:text-sm font-medium">
            Showing{' '}
            <b style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>{from}</b>–
            <b style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>{to}</b> of{' '}
            <b style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>{totalItems}</b>
          </span>
        )}

        {showPageSize && onPageSizeChange && (
          <label className="ax-cluster flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
            <span>Rows:</span>
            <select
              className="ax-select ax-select--sm text-xs sm:text-sm py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer outline-none focus:border-[#1A66FF]"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1);
              }}
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

      {/* Right side: Page navigation */}
      <nav className="ax-pagination flex items-center gap-1" aria-label="Page navigation">
        {showFirstLast && (
          <button
            type="button"
            className="ax-pagination__prev p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            onClick={() => goToPage(1)}
            disabled={safePage === 1}
            aria-disabled={safePage === 1}
            aria-label="First page"
            title="First page"
          >
            {CHEV_FIRST}
          </button>
        )}

        <button
          type="button"
          className="ax-pagination__prev p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          onClick={() => goToPage(safePage - 1)}
          disabled={safePage === 1}
          aria-disabled={safePage === 1}
          aria-label="Previous page"
          title="Previous page"
        >
          {CHEV_L}
        </button>

        <ul className="ax-pagination__pages flex items-center gap-1 list-none p-0 m-0">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <li key={`ellipsis-${idx}`} aria-hidden="true">
                  <span className="ax-pagination__ellipsis px-2 py-1 text-slate-400 select-none">…</span>
                </li>
              );
            }
            const isActive = p === safePage;
            return (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`ax-pagination__page min-w-[32px] h-8 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'is-active bg-[#1A66FF] text-white shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                >
                  {p}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="ax-pagination__next p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          onClick={() => goToPage(safePage + 1)}
          disabled={safePage === totalPages}
          aria-disabled={safePage === totalPages}
          aria-label="Next page"
          title="Next page"
        >
          {CHEV_R}
        </button>

        {showFirstLast && (
          <button
            type="button"
            className="ax-pagination__next p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            onClick={() => goToPage(totalPages)}
            disabled={safePage === totalPages}
            aria-disabled={safePage === totalPages}
            aria-label="Last page"
            title="Last page"
          >
            {CHEV_LAST}
          </button>
        )}
      </nav>
    </div>
  );
}

export default Pagination;
