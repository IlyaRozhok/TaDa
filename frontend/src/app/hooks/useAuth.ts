"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser, logout as logoutAction } from "../store/slices/authSlice";
import { authAPI } from "../lib/api";

interface AuthUserData {
  email: string;
  password: string;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const dispatch = useDispatch();

  const login = async (data: AuthUserData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.login(data);
      dispatch(setUser({ user: response.data.user }));

      const userRole = response.data.user?.role;
      if (userRole === "tenant") {
        router.push("/app/units");
      } else if (userRole === "operator") {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: AuthUserData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.register(data);
      dispatch(setUser({ user: response.data.user }));

      const userRole = response.data.user?.role;
      if (userRole === "tenant") {
        router.push("/app/units");
      } else if (userRole === "operator") {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithPreferences = async (
    data: AuthUserData & { role: string }
  ) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.register(data);
      dispatch(setUser({ user: response.data.user }));
      router.push("/app/units");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    dispatch(logoutAction());
    router.push("/");
  };

  return {
    login,
    register,
    registerWithPreferences,
    logout,
    isLoading,
    error,
    setError,
  };
}
