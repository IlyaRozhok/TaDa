import { ActionReducerMapBuilder, AsyncThunk } from "@reduxjs/toolkit";

// Generic loading state interface
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// Generic state with loading
export interface StateWithLoading extends LoadingState {
  [key: string]: any;
}

// Helper to create standard loading reducers
export const addLoadingCase = <T extends StateWithLoading, P, R>(
  builder: ActionReducerMapBuilder<T>,
  thunk: AsyncThunk<R, P, any>
) => {
  builder
    .addCase(thunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(thunk.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
    })
    .addCase(thunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string || "An error occurred";
    });
};

// Helper to create standard CRUD reducers
export const addCrudCases = <T extends StateWithLoading, Item>(
  builder: ActionReducerMapBuilder<T>,
  thunks: {
    fetch?: AsyncThunk<Item[], any, any>;
    create?: AsyncThunk<Item, any, any>;
    update?: AsyncThunk<Item, any, any>;
    delete?: AsyncThunk<any, any, any>;
  },
  itemsKey: keyof T
) => {
  if (thunks.fetch) {
    addLoadingCase(builder, thunks.fetch);
    builder.addCase(thunks.fetch.fulfilled, (state, action) => {
      (state as any)[itemsKey] = action.payload;
    });
  }

  if (thunks.create) {
    addLoadingCase(builder, thunks.create);
    builder.addCase(thunks.create.fulfilled, (state, action) => {
      const items = (state as any)[itemsKey] as Item[];
      if (Array.isArray(items)) {
        items.push(action.payload);
      }
    });
  }

  if (thunks.update) {
    addLoadingCase(builder, thunks.update);
    builder.addCase(thunks.update.fulfilled, (state, action) => {
      const items = (state as any)[itemsKey] as Item[];
      if (Array.isArray(items)) {
        const payload = action.payload as any;
        const index = items.findIndex((item: any) => (item as any).id === payload.id);
        if (index !== -1) {
          items[index] = action.payload;
        }
      }
    });
  }

  if (thunks.delete) {
    addLoadingCase(builder, thunks.delete);
    builder.addCase(thunks.delete.fulfilled, (state, action) => {
      const items = (state as any)[itemsKey] as Item[];
      if (Array.isArray(items)) {
        const idToDelete = action.meta.arg; // The ID passed to the thunk
        (state as any)[itemsKey] = items.filter((item: any) => item.id !== idToDelete);
      }
    });
  }
};

// Helper to reset state to initial values
export const createResetAction = <T>(initialState: T) => {
  return (state: T) => {
    Object.assign(state, initialState);
  };
};

// Helper for optimistic updates
export const createOptimisticUpdate = <T, Item>(
  itemsKey: keyof T,
  updateFn: (items: Item[], payload: any) => Item[]
) => {
  return (state: T, action: any) => {
    const items = (state as any)[itemsKey] as Item[];
    if (Array.isArray(items)) {
      (state as any)[itemsKey] = updateFn(items, action.payload);
    }
  };
};