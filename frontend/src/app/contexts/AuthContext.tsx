"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  // State
  credentials: AuthCredentials | null;

  // Actions
  setCredentials: (credentials: AuthCredentials | null) => void;
  clearCredentials: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);

  // Restore credentials from localStorage on mount
  React.useEffect(() => {
    const savedCredentials = localStorage.getItem("authCredentials");
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        console.log(
          "🔍 AuthContext - restoring credentials from localStorage:",
          {
            email: parsed.email,
            password: parsed.password ? "***" : "empty",
          }
        );
        setCredentials(parsed);
      } catch (e) {
        console.error("Error parsing saved credentials:", e);
      }
    }
  }, []);

  // Save credentials to localStorage when they change
  React.useEffect(() => {
    if (credentials) {
      console.log("🔍 AuthContext - saving credentials to localStorage");
      localStorage.setItem("authCredentials", JSON.stringify(credentials));
    } else {
      localStorage.removeItem("authCredentials");
    }
  }, [credentials]);

  const clearCredentials = () => {
    console.log("🔍 AuthContext - clearing credentials", new Error().stack);
    setCredentials(null);
    localStorage.removeItem("authCredentials");
  };

  const contextValue: AuthContextType = {
    // State
    credentials,

    // Actions
    setCredentials,
    clearCredentials,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
