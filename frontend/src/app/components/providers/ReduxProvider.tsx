"use client";

import { Provider } from "react-redux";
import { store } from "../../store/store";
import { restoreSession } from "../../store/slices/authSlice";
import { checkAuthStatus } from "../../lib/api";
import { useEffect } from "react";

function SessionInitializer() {
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authData = await checkAuthStatus();
        if (authData) {
          store.dispatch(
            restoreSession({
              user: authData.user,
              accessToken: authData.accessToken,
            })
          );
        }
      } catch (error) {
        console.log("No active session found");
      }
    };

    initializeAuth();
  }, []);

  return null;
}

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <SessionInitializer />
      {children}
    </Provider>
  );
}
