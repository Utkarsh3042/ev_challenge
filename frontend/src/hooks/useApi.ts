'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClientError } from '@/lib/api';

export interface UseApiResult<T> {
  data: T | null;
  error: ApiClientError | Error | null;
  loading: boolean;
  refetch: () => void;
}

/**
 * Generic data-fetching hook. Pass a function that returns a Promise<T>;
 * the hook re-fetches when `deps` change or `refetch()` is called.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiClientError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => {
        if (cancelled || !mounted.current) return;
        setData(res);
      })
      .catch((err) => {
        if (cancelled || !mounted.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (cancelled || !mounted.current) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, error, loading, refetch };
}
