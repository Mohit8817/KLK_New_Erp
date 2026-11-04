import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions<T> {
  data?: T[];
  initialPageSize?: number;
  initialPage?: number;
}

/**
 * Universal pagination hook identical to the logic in Grid.js table.
 * Supports both:
 *   usePagination({ data: items, initialPageSize: 100 })
 * and
 *   usePagination(items, { initialPageSize: 100 })
 */
export function usePagination<T>(
  optionsOrData: UsePaginationOptions<T> | T[] = [],
  legacyOpts?: number | { initialPageSize?: number; initialPage?: number }
) {
  let rawData: T[] = [];
  let defaultPageSize = 100;
  let defaultPage = 1;

  if (Array.isArray(optionsOrData)) {
    rawData = optionsOrData;
    if (typeof legacyOpts === 'number') {
      defaultPageSize = legacyOpts;
    } else if (legacyOpts && typeof legacyOpts === 'object') {
      if (legacyOpts.initialPageSize) defaultPageSize = legacyOpts.initialPageSize;
      if (legacyOpts.initialPage) defaultPage = legacyOpts.initialPage;
    }
  } else if (optionsOrData && typeof optionsOrData === 'object') {
    rawData = Array.isArray(optionsOrData.data) ? optionsOrData.data : [];
    if (optionsOrData.initialPageSize) defaultPageSize = optionsOrData.initialPageSize;
    if (optionsOrData.initialPage) defaultPage = optionsOrData.initialPage;
  }

  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const data = Array.isArray(rawData) ? rawData : [];
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const curPage = Math.max(1, Math.min(page, totalPages));

  const start = (curPage - 1) * pageSize;
  const paged = useMemo(() => data.slice(start, start + pageSize), [data, start, pageSize]);
  const rangeStart = totalItems ? start + 1 : 0;
  const rangeEnd = Math.min(curPage * pageSize, totalItems);
  const pageList = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  const handlePageChange = useCallback((newPage: number) => {
<<<<<<< HEAD
    if (typeof newPage !== 'number' || isNaN(newPage)) return;
    setPage(Math.max(1, newPage));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    if (typeof newSize !== 'number' || isNaN(newSize) || newSize <= 0) return;
    setPageSize(newSize);
    setPage(1);
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);
=======
    setPage((prev) => {
      if (typeof newPage !== 'number' || isNaN(newPage)) return prev;
      return newPage;
    });
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);
>>>>>>> 2f0aa566777502bc3b3e798fde4619376ae6a976

  return {
    // Exact Grid.js names
    paged,
    curPage,
    totalPages,
    rangeStart,
    rangeEnd,
    pageList,
    page: curPage,
    pageSize,
    totalItems,
    total: totalItems,
    totalRecords: totalItems,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    nextPage: handleNextPage,
    prevPage: handlePrevPage,
    canNext: curPage < totalPages,
    canPrev: curPage > 1,

    // Compatibility aliases
    pageItems: paged,
    startIndex: start,
    paginatedData: paged,
    currentPage: curPage,
    from: rangeStart,
    to: rangeEnd,
  };
}

export default usePagination;
