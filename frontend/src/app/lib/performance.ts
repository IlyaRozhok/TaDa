import { useCallback, useMemo, useRef, useEffect } from "react";

// Debounce hook for expensive operations
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for frequent events
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Memoized callback with stable reference
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): T {
  return useCallback(callback, deps);
}

// Memoized value with stable reference
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList = []
): T {
  return useMemo(factory, deps);
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, hasIntersected]);

  return { elementRef, isIntersecting, hasIntersected };
}

// Virtual scrolling utilities
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );

    return {
      start: Math.max(0, start - overscan),
      end,
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔄 ${componentName} rendered (${renderCount.current} times, ${timeSinceLastRender}ms since last render)`
      );
    }
  });

  return {
    renderCount: renderCount.current,
  };
}

// Memory leak prevention hook
export function useCleanupEffect(
  cleanup: () => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    return cleanup;
  }, deps);
}

// Async state management hook
export function useAsyncState<T>(
  initialState: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = React.useState<T>(initialState);
  const [isLoading, setIsLoading] = React.useState(false);

  const setAsyncState = useCallback(async (value: T | ((prev: T) => T)) => {
    setIsLoading(true);
    try {
      if (typeof value === "function") {
        setState((prev) => (value as (prev: T) => T)(prev));
      } else {
        setState(value);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [state, setAsyncState, isLoading];
}

// Batch updates hook
export function useBatchUpdates() {
  const batchRef = useRef<(() => void)[]>([]);
  const isBatching = useRef(false);

  const batchUpdate = useCallback((update: () => void) => {
    if (isBatching.current) {
      batchRef.current.push(update);
    } else {
      update();
    }
  }, []);

  const startBatch = useCallback(() => {
    isBatching.current = true;
  }, []);

  const commitBatch = useCallback(() => {
    isBatching.current = false;
    const updates = batchRef.current;
    batchRef.current = [];
    updates.forEach((update) => update());
  }, []);

  return { batchUpdate, startBatch, commitBatch };
}

// Resource preloading hook
export function usePreload<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    loader()
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, deps);

  return { data, isLoading, error };
}

// Performance optimization utilities
export const performanceUtils = {
  // Memoize expensive computations
  memoize: <T extends (...args: any[]) => any>(
    fn: T,
    getKey?: (...args: Parameters<T>) => string
  ): T => {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
      const key = getKey ? getKey(...args) : JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Batch DOM updates
  batchDOMUpdates: (updates: (() => void)[]) => {
    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      requestAnimationFrame(() => {
        updates.forEach((update) => update());
      });
    } else {
      updates.forEach((update) => update());
    }
  },

  // Measure execution time
  measureTime: <T>(fn: () => T): { result: T; time: number } => {
    const start = performance.now();
    const result = fn();
    const time = performance.now() - start;
    return { result, time };
  },

  // Async measure execution time
  measureAsyncTime: async <T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const time = performance.now() - start;
    return { result, time };
  },
};
