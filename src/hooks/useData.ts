/**
 * Custom hook for fetching data with client-side caching
 * Prevents duplicate requests and improves performance
 */

import { useEffect, useState, useRef } from 'react';

interface CacheEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const dataCache = new Map<string, CacheEntry>();

export function useData<T>(
  url: string,
  options?: {
    ttl?: number; // Cache duration in milliseconds (default: 5 minutes)
    skip?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const ttl = options?.ttl ?? 5 * 60 * 1000; // 5 minutes default
  const skip = options?.skip ?? false;

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Check cache first
      const cached = dataCache.get(url);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Create abort controller for cleanup
        abortControllerRef.current = new AbortController();

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Store in cache
        dataCache.set(url, {
          data: result,
          timestamp: Date.now(),
          ttl,
        });

        setData(result);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
          console.error(`Failed to fetch ${url}:`, err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [url, ttl, skip]);

  return { data, loading, error };
}

/**
 * Clear the entire cache (useful for manual cache invalidation)
 */
export function clearDataCache() {
  dataCache.clear();
}

/**
 * Clear cache for a specific URL
 */
export function clearDataCacheForUrl(url: string) {
  dataCache.delete(url);
}
