import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions<T> {
  data?: T[];
  initialPageSize?: number;
  initialPage?: number;
}

/**
 * Universal pagination hook identical to the logic in Grid.js table.
 * Supports:
 *   usePagination({ data: items, initialPageSize: 10 })
 *   usePagination(items, { initialPageSize: 10 })
 *   usePagination(items, 100)
 * Returns { paged, pagedData, paginationProps, curPage, page, totalPages, ... }
 */
export function usePagination<T>(
  optionsOrData: UsePaginationOptions<T> | T[] = [],
  legacyOpts?: { initialPageSize?: number; initialPage?: number } | number
) {
  let rawData: T[] = [];
  let defaultPageSize = 8;
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
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

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
    nextPage: () => handlePageChange(curPage + 1),
    prevPage: () => handlePageChange(curPage - 1),
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
