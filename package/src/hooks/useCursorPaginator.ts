import { useCallback, useEffect, useRef, useState } from 'react';

import uniqBy from 'lodash/uniqBy';

export type PaginationFn<T> = (next?: string) => Promise<{ items: T[]; next?: string }>;

export const useCursorPaginator = <T>(paginationFn: PaginationFn<T>, loadFirstPage?: boolean) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();
  const cursorRef = useRef<string | null | undefined>();
  const queryInProgress = useRef<boolean>(false);

  const loadMore = useCallback(async () => {
    if (cursorRef.current === null || queryInProgress.current) return;

    setLoading(true);
    queryInProgress.current = true;
    try {
      const { items, next } = await paginationFn(cursorRef.current);
      cursorRef.current = next || null;
      setItems((prev) => uniqBy([...prev, ...items], 'id'));
    } catch (e) {
      setError(e as Error);
    }
    queryInProgress.current = false;
    setLoading(false);
  }, [paginationFn]);

  useEffect(() => {
    if (!loadFirstPage || items.length) return;
    loadMore();
  }, [loadFirstPage, loadMore, items]);

  return {
    error,
    hasNextPage: cursorRef.current !== null,
    items,
    loading,
    loadMore,
    next: cursorRef.current,
  };
};
