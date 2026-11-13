import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions<T> {
  data?: T[];
  initialPageSize?: number;
  initialPage?: number;
}

/**
 * Universal pagination hook identical to the logic in Grid.js table.
<<<<<<< HEAD
 * Supports:
 *   usePagination({ data: items, initialPageSize: 10 })
 *   usePagination(items, { initialPageSize: 10 })
 *   usePagination(items, 100)
 * Returns { paged, pagedData, paginationProps, curPage, page, totalPages, ... }
 */
export function usePagination<T>(
  optionsOrData: UsePaginationOptions<T> | T[] = [],
  legacyOpts?: { initialPageSize?: number; initialPage?: number } | number
=======
 * Supports both:
 *   usePagination({ data: items, initialPageSize: 100 })
 * and
 *   usePagination(items, { initialPageSize: 100 })
 */
export function usePagination<T>(
  optionsOrData: UsePaginationOptions<T> | T[] = [],
  legacyOpts?: number | { initialPageSize?: number; initialPage?: number }
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
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
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
=======
<<<<<<< HEAD
    if (typeof newPage !== 'number' || isNaN(newPage)) return;
    setPage(Math.max(1, newPage));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    if (typeof newSize !== 'number' || isNaN(newSize) || newSize <= 0) return;
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
    setPageSize(newSize);
    setPage(1);
  }, []);

<<<<<<< HEAD
  const paginationProps = {
    currentPage: curPage,
    curPage,
    page: curPage,
    pageSize,
    totalItems,
    total: totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
    setPage: handlePageChange,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  };
=======
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
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6

  return {
    // Exact Grid.js names
    paged,
    pagedData: paged,
    paginationProps,
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
