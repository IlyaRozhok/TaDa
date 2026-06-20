"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "@/store/slices/authSlice";

export function useAuth() {
  const router = useRouter();
  const dispatch = useDispatch();

  const logout = () => {
    dispatch(logoutAction());
    router.push("/");
  };

  return { logout };
}
