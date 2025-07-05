import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { apiSlice } from "./slices/apiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// setupListeners(store.dispatch); // Отключено для предотвращения автоматического refetching

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
