import { useState, useMemo } from 'react';

export interface UsePaginationOptions<T> {
  data: T[];
  initialPageSize?: number;
  initialPage?: number;
}

export function usePagination<T>({
  data,
  initialPageSize = 10,
  initialPage = 1,
}: UsePaginationOptions<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto adjust page if data length shrinks
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return {
    paginatedData,
    currentPage: safePage,
    pageSize,
    totalPages,
    totalItems,
    from,
    to,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
  };
}

export default usePagination;
