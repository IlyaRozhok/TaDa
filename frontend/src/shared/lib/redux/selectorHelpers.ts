import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store/store";

// Generic selector creator for slice state
export const createSliceSelector = <T>(sliceName: keyof RootState) => {
  return (state: RootState) => state[sliceName] as T;
};

// Generic loading selector
export const createLoadingSelector = <T extends { loading: boolean }>(
  sliceSelector: (state: RootState) => T
) => {
  return createSelector(sliceSelector, (slice) => slice.loading);
};

// Generic error selector
export const createErrorSelector = <T extends { error: string | null }>(
  sliceSelector: (state: RootState) => T
) => {
  return createSelector(sliceSelector, (slice) => slice.error);
};

// Generic items selector
export const createItemsSelector = <T, Item>(
  sliceSelector: (state: RootState) => T,
  itemsKey: keyof T
) => {
  return createSelector(sliceSelector, (slice) => slice[itemsKey] as Item[]);
};

// Generic item by ID selector
export const createItemByIdSelector = <T, Item extends { id: string }>(
  itemsSelector: (state: RootState) => Item[]
) => {
  return createSelector(
    [itemsSelector, (_: RootState, id: string) => id],
    (items, id) => items.find(item => item.id === id)
  );
};

// Generic filtered items selector
export const createFilteredItemsSelector = <T extends { id: string }>(
  itemsSelector: (state: RootState) => T[],
  filterFn: (item: T) => boolean
) => {
  return createSelector(itemsSelector, (items) => items.filter(filterFn));
};

// Generic sorted items selector
export const createSortedItemsSelector = <T>(
  itemsSelector: (state: RootState) => T[],
  sortFn: (a: T, b: T) => number
) => {
  return createSelector(itemsSelector, (items) => [...items].sort(sortFn));
};

// Generic count selector
export const createCountSelector = <T>(
  itemsSelector: (state: RootState) => T[]
) => {
  return createSelector(itemsSelector, (items) => items.length);
};

// Memoized selector for expensive computations
export const createMemoizedSelector = <T, R>(
  inputSelector: (state: RootState) => T,
  computeFn: (input: T) => R
) => {
  return createSelector(inputSelector, computeFn);
};