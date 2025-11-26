"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/slices/authSlice";
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

      dispatch(
        setAuth({
          user: response.data.user,
          accessToken: response.data.access_token,
        })
      );

      localStorage.setItem("accessToken", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirect based on user role
      const userRole = response.data.user?.role;
      if (userRole === "tenant") {
        router.push("/app/dashboard/tenant");
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

      dispatch(
        setAuth({
          user: response.data.user,
          accessToken: response.data.access_token,
        })
      );

      localStorage.setItem("accessToken", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirect based on user role
      const userRole = response.data.user?.role;
      if (userRole === "tenant") {
        router.push("/app/dashboard/tenant");
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

      dispatch(
        setAuth({
          user: response.data.user,
          accessToken: response.data.access_token,
        })
      );

      localStorage.setItem("accessToken", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // All new users are tenants, redirect to tenant dashboard
      router.push("/app/dashboard/tenant");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    dispatch(setAuth({ user: null, accessToken: null }));
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
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
