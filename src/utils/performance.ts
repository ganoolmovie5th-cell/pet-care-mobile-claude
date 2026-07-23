import React, { useMemo, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function memoizeAsync<Args extends any[], Return>(
  fn: (...args: Args) => Promise<Return>,
  keyGenerator: (...args: Args) => string
) {
  const cache = new Map<string, Promise<Return>>();

  return async (...args: Args): Promise<Return> => {
    const key = keyGenerator(...args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const promise = fn(...args);
    cache.set(key, promise);

    try {
      return await promise;
    } catch (err) {
      cache.delete(key);
      throw err;
    }
  };
}

export function optimizeImage(url: string, width: number = 300, quality: number = 80): string {
  if (!url) return '';

  const params = new URLSearchParams();
  params.append('w', width.toString());
  params.append('q', quality.toString());

  return `${url}?${params.toString()}`;
}

export function useMemorizedList<T>(
  items: T[],
  compareFn: (prev: T[], next: T[]) => boolean = (a, b) => a.length === b.length
) {
  return useMemo(() => items, [items, items.length]);
}
