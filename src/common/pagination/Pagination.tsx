
import { useMemo, type CSSProperties } from 'react';

export interface PaginationProps {
  currentPage?: number;
  curPage?: number;
  totalItems?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  setPage?: (page: number) => void;
  rangeStart?: number;
  rangeEnd?: number;
  showSummary?: boolean;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  style?: CSSProperties;
  className?: string;
}

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
  const page = curPage ?? currentPage ?? 1;
  const count = total ?? totalItems ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const activePage = Math.max(1, Math.min(page, totalPages));

  const start = (activePage - 1) * pageSize;
  const calculatedRangeStart = count ? start + 1 : 0;
  const calculatedRangeEnd = Math.min(activePage * pageSize, count);

  const actualRangeStart =
    rangeStart !== undefined ? rangeStart : calculatedRangeStart;

  const actualRangeEnd =
    rangeEnd !== undefined ? rangeEnd : calculatedRangeEnd;

  const handlePage = (p: number) => {
    const target = Math.max(1, Math.min(p, totalPages));

    if (setPage) {
      setPage(target);
    } else if (onPageChange) {
      onPageChange(target);
    }
  };

  const pagesList = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    const s = Math.max(2, activePage - 1);
    const e = Math.min(totalPages - 1, activePage + 1);

    if (s > 2) pages.push('ellipsis');

    for (let i = s; i <= e; i++) {
      pages.push(i);
    }

    if (e < totalPages - 1) pages.push('ellipsis');

    pages.push(totalPages);

    return pages;
  }, [totalPages, activePage]);

  return (
    <>
      <style>
        {`
          @media (max-width: 480px) {
            .ax-pagination-mobile {
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              width: 100% !important;
              gap: 10px !important;
            }

            .ax-pagination-mobile-info {
              width: 100% !important;
              justify-content: center !important;
              text-align: center !important;
              gap: 8px !important;
            }

            .ax-pagination-mobile-nav {
              width: 100% !important;
              justify-content: center !important;
            }

            .ax-pagination-mobile-pages {
              max-width: calc(100vw - 100px) !important;
              overflow-x: auto !important;
              justify-content: flex-start !important;
              scrollbar-width: none !important;
            }

            .ax-pagination-mobile-pages::-webkit-scrollbar {
              display: none !important;
            }

            .ax-pagination-mobile .ax-pagination__page,
            .ax-pagination-mobile .ax-pagination__prev,
            .ax-pagination-mobile .ax-pagination__next {
              min-width: 34px !important;
              width: 34px !important;
              height: 34px !important;
              min-height: 34px !important;
              padding: 0 !important;
            }

            .ax-pagination-mobile .ax-pagination__prev svg,
            .ax-pagination-mobile .ax-pagination__next svg {
              width: 17px !important;
              height: 17px !important;
            }

            .ax-pagination-mobile-size {
              justify-content: center !important;
            }
          }

          @media (max-width: 360px) {
            .ax-pagination-mobile-pages {
              max-width: calc(100vw - 90px) !important;
            }

            .ax-pagination-mobile .ax-pagination__page,
            .ax-pagination-mobile .ax-pagination__prev,
            .ax-pagination-mobile .ax-pagination__next {
              min-width: 32px !important;
              width: 32px !important;
              height: 32px !important;
              min-height: 32px !important;
            }
          }
        `}
      </style>

      <div
        className={`ax-card__footer ax-flex ax-pagination-mobile ${className}`.trim()}
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--ax-space-3)',
          borderTop: 'none',
          padding: 0,
          width: '100%',
          ...style,
        }}
      >
        <div
          className="ax-cluster ax-pagination-mobile-info"
          style={{
            gap: 'var(--ax-space-3)',
            alignItems: 'center',
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          {showSummary && (
            <span
              className="ax-pagination__summary ax-num"
              style={{
                fontFamily: 'var(--ax-font-mono)',
                fontSize: 'var(--ax-text-xs)',
                whiteSpace: 'nowrap',
              }}
            >
              Showing {actualRangeStart} to {actualRangeEnd} of {count}
            </span>
          )}

          {onPageSizeChange &&
            pageSizeOptions &&
            pageSizeOptions.length > 0 && (
              <label
                className="ax-cluster ax-pagination-mobile-size"
                style={{
                  gap: 'var(--ax-space-1)',
                  alignItems: 'center',
                  fontSize: 'var(--ax-text-xs)',
                  color: 'var(--ax-text-muted)',
                }}
              >
                <span>Rows:</span>

                <select
                  className="ax-input ax-input--sm"
                  value={pageSize}
                  onChange={(e) => {
                    const s = Number(e.target.value);
                    onPageSizeChange(s);
                    handlePage(1);
                  }}
                  style={{
                    width: 'auto',
                    minWidth: 58,
                    padding: '2px 8px',
                    height: 30,
                    fontSize: 'var(--ax-text-xs)',
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

        <nav
          className="ax-pagination ax-pagination-mobile-nav"
          aria-label="Pagination"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          <button
            type="button"
            className="ax-pagination__prev"
            disabled={activePage === 1}
            aria-disabled={activePage === 1}
            onClick={() => handlePage(activePage - 1)}
            aria-label="Previous page"
            style={{
              flexShrink: 0,
              minWidth: 36,
              minHeight: 36,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 6l-6 6l6 6" />
            </svg>
          </button>

          <ul
            className="ax-pagination__pages ax-pagination-mobile-pages"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'nowrap',
              maxWidth: '100%',
              minWidth: 0,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {pagesList.map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <li
                    key={`ell-${idx}`}
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  >
                    <span
                      className="ax-pagination__ellipsis"
                      style={{
                        padding: '0 5px',
                        color: 'var(--ax-text-subtle)',
                      }}
                    >
                      …
                    </span>
                  </li>
                );
              }

              return (
                <li
                  key={p}
                  style={{
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    className={`ax-pagination__page${
                      activePage === p ? ' is-active' : ''
                    }`}
                    aria-current={
                      activePage === p ? 'page' : undefined
                    }
                    onClick={() => handlePage(p)}
                    style={{
                      minWidth: 36,
                      minHeight: 36,
                      flexShrink: 0,
                    }}
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
            style={{
              flexShrink: 0,
              minWidth: 36,
              minHeight: 36,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6l6 6l-6 6" />
            </svg>
          </button>
        </nav>
      </div>
    </>
  );
}

export default Pagination;
