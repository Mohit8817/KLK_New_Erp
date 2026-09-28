import { useState, useMemo } from 'react';

export type SearchFieldAccessor<T> = keyof T | ((item: T) => string | number | null | undefined);

export interface UseTableSearchOptions<T> {
  data: T[];
  searchFields: SearchFieldAccessor<T>[];
  initialQuery?: string;
}

export function useTableSearch<T>({
  data,
  searchFields,
  initialQuery = '',
}: UseTableSearchOptions<T>) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data;

    return data.filter((item) => {
      return searchFields.some((field) => {
        let val: any;
        if (typeof field === 'function') {
          val = field(item);
        } else {
          val = item[field];
        }

        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchFields, searchQuery]);

  const clearSearch = () => setSearchQuery('');

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    clearSearch,
    isSearching: searchQuery.trim().length > 0,
    matchCount: filteredData.length,
  };
}

export default useTableSearch;
