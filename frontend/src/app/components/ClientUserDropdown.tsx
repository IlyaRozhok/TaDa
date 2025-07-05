"use client";

import dynamic from "next/dynamic";

// Динамический импорт UserDropdown с отключением SSR
const UserDropdown = dynamic(() => import("./UserDropdown"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center space-x-2 p-2 rounded-lg">
      <div className="h-5 w-5 bg-gray-300 rounded animate-pulse" />
      <div className="hidden sm:block h-4 w-16 bg-gray-300 rounded animate-pulse" />
    </div>
  ),
});

export default UserDropdown;
