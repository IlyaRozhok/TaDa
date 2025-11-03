"use client";

import React from "react";
import Image from "next/image";

interface RoleSelectionProps {
  selectedRole: "tenant" | "operator" | null;
  onRoleSelect: (role: "tenant" | "operator") => void;
  onContinue: () => void;
  error: string;
  isLoading: boolean;
}

export default function RoleSelection({
  selectedRole,
  onRoleSelect,
  onContinue,
  error,
  isLoading,
}: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">
              Choose your role
            </h2>
            <p className="text-gray-600">
              Select how you'll be using platform. For now one account - one
              role
            </p>
          </div>
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => onRoleSelect("tenant")}
              className={`p-6 rounded-lg border-2 transition-all duration-300 ${
                selectedRole === "tenant"
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <Image
                  src="/choose-role-tenant.png"
                  alt="Tenant"
                  width={80}
                  height={80}
                  className="mx-auto mb-4 rounded-lg"
                />
                <h3 className="font-bold text-black mb-2">Tenant</h3>
                <p className="text-sm text-gray-600 max-w-48">
                  Browse properties, save favorites and connect with landlords
                  to find your perfect home
                </p>
              </div>
            </button>
            <button
              onClick={() => onRoleSelect("operator")}
              className={`p-6 rounded-lg border-2 transition-all duration-300 ${
                selectedRole === "operator"
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <Image
                  src="/choose-role-operator.png"
                  alt="Operator"
                  width={80}
                  height={80}
                  className="mx-auto mb-4 rounded-lg"
                />
                <h3 className="font-bold text-black mb-2">Property Owner</h3>
                <p className="text-sm text-gray-600 max-w-48">
                  List properties, manage tenants and grow your rental business
                  with our platform
                </p>
              </div>
            </button>
          </div>
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-4xl mx-auto flex justify-center">
          <button
            onClick={onContinue}
            disabled={isLoading || !selectedRole}
            className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Setting up..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

