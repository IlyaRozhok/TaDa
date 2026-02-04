/**
 * Virtual scrolling implementation for large lists
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside visible area
  scrollingDelay?: number; // Delay before considering scrolling stopped
}

export interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number;
    item: T;
    offsetTop: number;
  }>;
  totalHeight: number;
  scrollElementProps: {
    style: React.CSSProperties;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  };
  viewportProps: {
    style: React.CSSProperties;
  };
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    scrollingDelay = 150,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const visibleStartIndex = Math.floor(scrollTop / itemHeight);
    const visibleEndIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const startIdx = Math.max(0, visibleStartIndex - overscan);
    const endIdx = Math.min(items.length - 1, visibleEndIndex + overscan);

    const visible = [];
    for (let i = startIdx; i <= endIdx; i++) {
      visible.push({
        index: i,
        item: items[i],
        offsetTop: i * itemHeight,
      });
    }

    return {
      startIndex: startIdx,
      endIndex: endIdx,
      visibleItems: visible,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
  }, []);

  // Handle scrolling state
  useEffect(() => {
    if (!isScrolling) return;

    const timeoutId = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);

    return () => clearTimeout(timeoutId);
  }, [scrollTop, scrollingDelay, isScrolling]);

  const totalHeight = items.length * itemHeight;

  return {
    virtualItems: visibleItems,
    totalHeight,
    scrollElementProps: {
      style: {
        height: containerHeight,
        overflow: 'auto',
      },
      onScroll: handleScroll,
    },
    viewportProps: {
      style: {
        height: totalHeight,
        position: 'relative',
      },
    },
  };
}

/**
 * Virtual grid hook for 2D virtualization
 */
export interface VirtualGridOptions {
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  gap?: number;
  overscan?: number;
}

export function useVirtualGrid<T>(
  items: T[],
  options: VirtualGridOptions
) {
  const {
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    gap = 0,
    overscan = 2,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const columnsCount = Math.floor(containerWidth / (itemWidth + gap));
  const rowsCount = Math.ceil(items.length / columnsCount);

  const { virtualItems } = useMemo(() => {
    const visibleStartRow = Math.floor(scrollTop / (itemHeight + gap));
    const visibleEndRow = Math.ceil((scrollTop + containerHeight) / (itemHeight + gap));

    const startRow = Math.max(0, visibleStartRow - overscan);
    const endRow = Math.min(rowsCount - 1, visibleEndRow + overscan);

    const visible = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columnsCount; col++) {
        const index = row * columnsCount + col;
        if (index < items.length) {
          visible.push({
            index,
            item: items[index],
            row,
            col,
            offsetTop: row * (itemHeight + gap),
            offsetLeft: col * (itemWidth + gap),
          });
        }
      }
    }

    return { virtualItems: visible };
  }, [
    items,
    scrollTop,
    scrollLeft,
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    gap,
    overscan,
    columnsCount,
    rowsCount,
  ]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  const totalHeight = rowsCount * (itemHeight + gap) - gap;
  const totalWidth = columnsCount * (itemWidth + gap) - gap;

  return {
    virtualItems,
    totalHeight,
    totalWidth,
    columnsCount,
    rowsCount,
    scrollElementProps: {
      style: {
        width: containerWidth,
        height: containerHeight,
        overflow: 'auto',
      },
      onScroll: handleScroll,
    },
    viewportProps: {
      style: {
        height: totalHeight,
        width: totalWidth,
        position: 'relative',
      },
    },
  };
}