"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { authAPI } from "../lib/api";

export function useAuth() {
  const router = useRouter();
  const dispatch = useDispatch();

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      dispatch(logoutAction());
      router.push("/");
    }
  };

  return { logout };
}
