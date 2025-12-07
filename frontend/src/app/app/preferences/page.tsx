"use client";

import NewPreferencesPage from "@/app/components/preferences/NewPreferencesPage";
import TenantUniversalHeader from "@/app/components/TenantUniversalHeader";
import { useState } from "react";

export default function PreferencesPageRoute() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <TenantUniversalHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        preferencesCount={0}
        showBackButton={false}
        showSearchInput={false}
        showPreferencesButton={false}
        showSaveButton={false}
      />
      
      <NewPreferencesPage />
    </div>
  );
}
