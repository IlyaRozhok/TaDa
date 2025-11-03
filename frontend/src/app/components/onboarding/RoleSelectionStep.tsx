"use client";

import React from "react";
import { Users, Building } from "lucide-react";
import { Button } from "../ui/Button";

interface RoleSelectionStepProps {
  selectedRole: "tenant" | "operator" | null;
  onRoleSelect: (role: "tenant" | "operator") => void;
  loading?: boolean;
}

export default function RoleSelectionStep({
  selectedRole,
  onRoleSelect,
  loading = false,
}: RoleSelectionStepProps) {
  const roles = [
    {
      id: "tenant" as const,
      title: "I'm looking to rent",
      description: "Find your perfect home with our smart matching system",
      icon: Users,
      features: [
        "Smart property matching",
        "Save favorite properties",
        "Get personalized recommendations",
        "Track your search history",
      ],
    },
    {
      id: "operator" as const,
      title: "I manage properties",
      description: "List and manage your properties with our platform",
      icon: Building,
      features: [
        "List unlimited properties",
        "Manage tenant applications",
        "Track property performance",
        "Professional dashboard",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Choose your role
        </h2>
        <p className="text-gray-600">
          Tell us who you are so we can personalize your experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <div
              key={role.id}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-lg"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                }
              `}
              onClick={() => !loading && onRoleSelect(role.id)}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  ${isSelected ? "bg-blue-100" : "bg-gray-100"}
                `}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isSelected ? "text-blue-600" : "text-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {role.title}
                  </h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>

              <ul className="space-y-2">
                {role.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <svg
                      className="w-4 h-4 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {selectedRole && (
        <div className="text-center pt-4">
          <Button
            onClick={() => onRoleSelect(selectedRole)}
            disabled={loading}
            className="px-8 py-3"
          >
            {loading ? "Setting up..." : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
}
