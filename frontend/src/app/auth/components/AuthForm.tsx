"use client";

import React, { useState, useEffect } from "react";
import { useOnboardingContext } from "../../contexts/OnboardingContext";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: { email: string; password: string }) => void;
  isLoading?: boolean;
  error?: string;
}

export default function AuthForm({
  mode,
  onSubmit,
  isLoading = false,
  error,
}: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const onboardingContext = useOnboardingContext();

  // Load saved data from context and localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("authFormData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData((prev) => ({
          ...prev,
          email: parsed.email || "",
          password: parsed.password || "",
        }));
      } catch (e) {
        console.error("Error parsing saved auth data:", e);
      }
    }

    // Also sync with context
    if (onboardingContext.userData.email) {
      setFormData((prev) => ({
        ...prev,
        email: onboardingContext.userData.email,
        password: onboardingContext.userData.password,
      }));
    }
  }, [onboardingContext.userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    // Save to localStorage
    localStorage.setItem("authFormData", JSON.stringify(updatedData));

    // Update context
    onboardingContext.setUserData({
      email: updatedData.email,
      password: updatedData.password,
      provider: "local",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register" && formData.password !== formData.confirmPassword) {
      return;
    }

    onSubmit({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={
            mode === "register" ? "Create a password" : "Enter your password"
          }
        />
      </div>

      {mode === "register" && (
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm your password"
          />
          {formData.password &&
            formData.confirmPassword &&
            formData.password !== formData.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">
                Passwords do not match
              </p>
            )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={
          isLoading ||
          (mode === "register" &&
            formData.password !== formData.confirmPassword)
        }
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Loading..." : mode === "register" ? "Register" : "Login"}
      </button>
    </form>
  );
}
