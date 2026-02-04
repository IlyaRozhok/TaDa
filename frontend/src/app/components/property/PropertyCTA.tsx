"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button/Button";
import { Lock } from "lucide-react";

export default function PropertyCTA() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Lock className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold">Want to save this property?</h3>
        </div>
        <p className="text-gray-200 mb-4">
          Create a free account to save favorites, contact property operators,
          and get personalized matches
        </p>
        <div className="flex gap-3">
          <Link href="/app/auth/register">
            <Button className="bg-white text-gray-900 hover:bg-gray-100">
              Sign Up Free
            </Button>
          </Link>
          <Link href="/app/auth/login">
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
