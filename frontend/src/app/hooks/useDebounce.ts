import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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

/**
 * Custom hook for debouncing function calls
 * @param callback - The function to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns The debounced function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Custom hook for debouncing API calls with loading state
 * @param apiCall - The async API function to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Object with debounced call function, loading state, and cancel function
 */
export function useDebouncedApiCall<T extends (...args: any[]) => Promise<any>>(
  apiCall: T,
  delay: number = 300
) {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const cancelRef = useRef<() => void | undefined>(undefined);

  const debouncedCall = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | null> => {
      // Cancel previous call if it exists
      if (cancelRef.current) {
        cancelRef.current();
      }

      return new Promise<Awaited<ReturnType<T>> | null>((resolve, reject) => {
        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        let isCancelled = false;

        // Set cancel function
        cancelRef.current = () => {
          isCancelled = true;
          setLoading(false);
          resolve(null);
        };

        // Set debounced timeout
        timeoutRef.current = setTimeout(async () => {
          if (isCancelled) return;

          try {
            setLoading(true);
            const result = await apiCall(...args);

            if (!isCancelled) {
              resolve(result);
            }
          } catch (error) {
            if (!isCancelled) {
              reject(error);
            }
          } finally {
            if (!isCancelled) {
              setLoading(false);
            }
          }
        }, delay);
      });
    },
    [apiCall, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (cancelRef.current) {
      cancelRef.current();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    debouncedCall,
    loading,
    cancel,
  };
}
