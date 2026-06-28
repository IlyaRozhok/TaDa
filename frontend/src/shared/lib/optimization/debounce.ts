/**
 * Debounce and throttle utilities for performance optimization
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * Debounce function - delays execution until after delay has passed since last call
 */
export function debounce<Args extends any[]>(
  func: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function - limits execution to once per delay period
 */
export function throttle<Args extends any[]>(
  func: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let lastCall = 0;
  
  return (...args: Args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * React hook for debounced values
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
 * React hook for debounced callbacks
 */
export function useDebouncedCallback<Args extends any[]>(
  callback: (...args: Args) => void,
  delay: number,
  deps: React.DependencyList = []
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    debounce((...args: Args) => callbackRef.current(...args), delay),
    [delay, ...deps]
  );
}

/**
 * React hook for throttled callbacks
 */
export function useThrottledCallback<Args extends any[]>(
  callback: (...args: Args) => void,
  delay: number,
  deps: React.DependencyList = []
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    throttle((...args: Args) => callbackRef.current(...args), delay),
    [delay, ...deps]
  );
}

/**
 * Advanced debounce with leading and trailing options
 */
export function advancedDebounce<Args extends any[]>(
  func: (...args: Args) => void,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): (...args: Args) => void {
  const { leading = false, trailing = true, maxWait } = options;
  
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  
  function invokeFunc(args: Args) {
    lastInvokeTime = Date.now();
    func(...args);
  }
  
  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    
    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }
  
  return (...args: Args) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastCallTime = time;
    
    if (isInvoking && leading && lastInvokeTime === 0) {
      invokeFunc(args);
      return;
    }
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (maxWait && !maxTimeoutId) {
      maxTimeoutId = setTimeout(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        maxTimeoutId = null;
        invokeFunc(args);
      }, maxWait);
    }
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
        maxTimeoutId = null;
      }
      if (trailing) {
        invokeFunc(args);
      }
    }, delay);
  };
}

// Fix missing import
import { useState } from 'react';