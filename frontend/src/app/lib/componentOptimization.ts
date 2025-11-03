import React, { memo, useMemo, useCallback, useEffect, useRef } from "react";

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

// Memoized component wrapper with performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = memo((props: P) => {
    const name = componentName || Component.displayName || Component.name;
    usePerformanceMonitor(name);
    return <Component {...props} />;
  });

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName || Component.name})`;
  return WrappedComponent;
}

// Optimized list rendering with virtualization support
export function useOptimizedList<T>(
  items: T[],
  itemHeight: number = 50,
  containerHeight: number = 400,
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
    visibleRange,
  };
}

// Debounced state hook for expensive operations
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [value, debouncedValue, setValue];
}

// Optimized image loading with lazy loading
export function useOptimizedImage(
  src: string,
  placeholder?: string
) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return {
    isLoaded,
    hasError,
    imgRef,
    src: hasError ? placeholder : src,
  };
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

// Optimized form handling with validation
export function useOptimizedForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Record<keyof T, any>
) {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const setValue = useCallback((key: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const rule = validationRules[key as keyof T];
      const value = values[key as keyof T];

      if (rule.required && !value) {
        newErrors[key as keyof T] = `${key} is required`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void>) => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate]);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    setValues,
    validate,
    handleSubmit,
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

// Optimized API call with caching
export function useOptimizedApiCall<T>(
  apiCall: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const cacheKey = useMemo(() => JSON.stringify(deps), deps);
  const cache = useRef<Map<string, T>>(new Map());

  const execute = useCallback(async () => {
    // Check cache first
    if (cache.current.has(cacheKey)) {
      setData(cache.current.get(cacheKey)!);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
      cache.current.set(cacheKey, result);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [apiCall, cacheKey]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

// Component optimization utilities
export const componentUtils = {
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
