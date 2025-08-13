"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/admin/panel");
  }, [router]);
  return null;
}
