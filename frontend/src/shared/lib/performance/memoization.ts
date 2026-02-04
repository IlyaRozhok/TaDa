/**
 * Memoization utilities for React components and functions
 */

import { memo, useMemo, useCallback, useRef, DependencyList } from 'react';

/**
 * Enhanced memo with custom comparison
 */
export function createMemoComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoComponent = memo(Component, propsAreEqual);
  MemoComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoComponent;
}

/**
 * Memoize expensive calculations
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Memoize callback functions
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Stable reference hook - returns the same reference until dependencies change
 */
export function useStableReference<T>(value: T, deps: DependencyList): T {
  const ref = useRef<T>(value);
  
  useMemo(() => {
    ref.current = value;
  }, deps);
  
  return ref.current;
}

/**
 * Memoize object/array props to prevent unnecessary re-renders
 */
export function useStableProps<T extends Record<string, any>>(
  props: T
): T {
  return useMemo(() => props, Object.values(props));
}

/**
 * Cache function results with LRU eviction
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Memoize function with LRU cache
 */
export function memoizeWithLRU<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  maxSize = 100,
  keyFn?: (...args: Args) => string
): (...args: Args) => Return {
  const cache = new LRUCache<string, Return>(maxSize);
  
  return (...args: Args): Return => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Deep comparison for memo
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    const arrA = a as unknown as any[];
    const arrB = b as unknown as any[];
    if (arrA.length !== arrB.length) return false;
    return arrA.every((item, index) => deepEqual(item, arrB[index]));
  }
  
  const objA = a as Record<string, any>;
  const objB = b as Record<string, any>;
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => 
    keysB.includes(key) && deepEqual(objA[key], objB[key])
  );
}

/**
 * Shallow comparison for memo (faster than deep comparison)
 */
export function shallowEqual<T extends Record<string, any>>(
  objA: T, 
  objB: T
): boolean {
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => objA[key] === objB[key]);
}