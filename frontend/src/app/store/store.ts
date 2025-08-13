import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { apiSlice } from "./slices/apiSlice";
import authSlice from "./slices/authSlice";
import usersSlice from "./slices/usersSlice";
import preferencesSlice from "./slices/preferencesSlice";
import operatorSlice from "./slices/operatorSlice";
import shortlistReducer from "./slices/shortlistSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authSlice,
    users: usersSlice,
    preferences: preferencesSlice,
    operator: operatorSlice,
    shortlist: shortlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          // Temporarily ignore shortlist actions while fixing serialization
          "shortlist/fetchShortlist/fulfilled",
          "shortlist/addToShortlist/fulfilled",
          "shortlist/removeFromShortlist/fulfilled",
          "shortlist/clearShortlist/fulfilled",
        ],
        // Also ignore specific paths in state that might contain non-serializable data
        ignoredPaths: [
          "api.queries", // RTK Query state
          "api.mutations", // RTK Query mutations
        ],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
