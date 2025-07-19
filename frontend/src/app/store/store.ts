import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { apiSlice } from "./slices/apiSlice";
import authSlice from "./slices/authSlice";
import usersSlice from "./slices/usersSlice";
import preferencesSlice from "./slices/preferencesSlice";
import operatorSlice from "./slices/operatorSlice";
import shortlistSlice from "./slices/shortlistSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authSlice,
    users: usersSlice,
    preferences: preferencesSlice,
    operator: operatorSlice,
    shortlist: shortlistSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
