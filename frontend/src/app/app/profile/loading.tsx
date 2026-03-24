import React from "react";
import ProfilePageSkeleton from "./ProfilePageSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <ProfilePageSkeleton />
    </div>
  );
}
