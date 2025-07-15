import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { apiSlice } from "./slices/apiSlice";
import usersReducer from "./slices/usersSlice";
import propertiesReducer from "./slices/propertiesSlice";
import preferencesReducer from "./slices/preferencesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    api: apiSlice.reducer,
    users: usersReducer,
    properties: propertiesReducer,
    preferences: preferencesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// setupListeners(store.dispatch); // Отключено для предотвращения автоматического refetching

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
