"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, updateUser } from "../../store/slices/authSlice";
import { authAPI } from "../../lib/api";
import DashboardHeader from "../../components/DashboardHeader";
import {
  ArrowLeft,
  User as UserIcon,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface UpdateUserData {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
}

const OCCUPATION_OPTIONS = [
  { value: "", label: "Select occupation" },
  { value: "full-time-employed", label: "Full-time employed" },
  { value: "part-time-employed", label: "Part-time employed" },
  { value: "freelancer", label: "Freelancer" },
  { value: "student", label: "Student" },
  { value: "self-employed", label: "Self-employed" },
  { value: "retired", label: "Retired" },
];

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<UpdateUserData>({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    nationality: "",
    occupation: "",
  });

  useEffect(() => {
    if (user) {
      // Get profile data based on user role
      const profile =
        user.role === "tenant" ? user.tenantProfile : user.operatorProfile;

      // Format date_of_birth for HTML date input (YYYY-MM-DD)
      let formattedDateOfBirth = "";
      const dateOfBirth = profile?.date_of_birth;
      if (dateOfBirth) {
        try {
          // Handle both date strings and Date objects
          const date = new Date(dateOfBirth);
          if (!isNaN(date.getTime())) {
            formattedDateOfBirth = date.toISOString().split("T")[0];
          }
        } catch (error) {
          console.warn("Error formatting date_of_birth:", error);
        }
      }

      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: profile?.phone || "",
        date_of_birth: formattedDateOfBirth,
        nationality: profile?.nationality || "",
        occupation: profile?.occupation || "",
      });
    }
  }, [user]);

  // Validation functions

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Clear any previous errors
    setErrors({});

    setIsLoading(true);

    try {
      const updateData: UpdateUserData = {};

      // Get profile data based on user role for comparison
      const profile =
        user?.role === "tenant" ? user.tenantProfile : user.operatorProfile;

      // Only include fields that have changed
      Object.keys(formData).forEach((key) => {
        const fieldKey = key as keyof UpdateUserData;
        let currentValue;

        // Get current value from appropriate source
        if (fieldKey === "full_name" || fieldKey === "email") {
          currentValue = user?.[fieldKey];
        } else if (fieldKey === "date_of_birth") {
          // Format current date for comparison
          const currentDate = profile?.date_of_birth;
          if (currentDate) {
            try {
              const date = new Date(currentDate);
              currentValue = !isNaN(date.getTime())
                ? date.toISOString().split("T")[0]
                : "";
            } catch {
              currentValue = "";
            }
          } else {
            currentValue = "";
          }
        } else {
          // phone, nationality, occupation come from profile
          currentValue = profile?.[fieldKey as keyof typeof profile];
        }

        if (formData[fieldKey] !== currentValue) {
          // Don't send empty date_of_birth
          if (
            fieldKey === "date_of_birth" &&
            (!formData[fieldKey] || formData[fieldKey].trim() === "")
          ) {
            // Skip empty date
          } else {
            updateData[fieldKey] = formData[fieldKey];
          }
        }
      });

      if (Object.keys(updateData).length === 0) {
        setError("No changes detected");
        setIsLoading(false);
        return;
      }

      console.log("🔄 Updating profile with:", updateData);

      // Make API call
      const response = await authAPI.updateProfile(updateData);

      console.log("✅ Profile update response:", response);

      // Update Redux state with new user data
      dispatch(updateUser(updateData));

      setSuccess("Profile updated successfully!");
      console.log("✅ Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: unknown) {
      setSuccess(null); // Ensure success message is cleared on error
      console.error("❌ Profile update error:", err);

      // Type guard for axios error
      const isAxiosError = (
        error: unknown
      ): error is {
        response?: {
          status?: number;
          data?: {
            message?: string;
            errors?: Array<{ field?: string; message?: string }>;
          };
        };
      } => {
        return (
          typeof error === "object" && error !== null && "response" in error
        );
      };

      // Handle different error types
      if (isAxiosError(err) && err.response?.status === 400) {
        const errorData = err.response?.data;
        const errorMessage = errorData?.message;

        // Handle NestJS validation errors where message is an array of strings
        if (Array.isArray(errorMessage)) {
          // Display the first validation error message
          setError(errorMessage[0]);
          console.error("❌ Validation error:", errorMessage);
        } else if (errorMessage && typeof errorMessage === "string") {
          setError(errorMessage);
          console.error("❌ Error message:", errorMessage);
        } else if (errorData?.errors) {
          // Handle validation errors from backend with field-specific format
          const backendErrors = errorData.errors;
          const newErrors: FormErrors = {};

          backendErrors.forEach(
            (error: { field?: string; message?: string }) => {
              if (error.field && error.message) {
                newErrors[error.field as keyof FormErrors] = error.message;
              }
            }
          );

          setErrors(newErrors);
          setError("Please fix the validation errors below");
        } else {
          setError("Invalid data provided. Please check your inputs.");
          console.error("❌ Unknown 400 error format:", errorData);
        }
      } else if (isAxiosError(err) && err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else if (isAxiosError(err) && err.response?.status === 409) {
        setError("Email already exists. Please use a different email.");
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form has changes to enable/disable submit button
  const hasChanges = useMemo(() => {
    if (!user) return false;

    // Get profile data based on user role for comparison
    const profile =
      user.role === "tenant" ? user.tenantProfile : user.operatorProfile;

    return Object.keys(formData).some((key) => {
      const fieldKey = key as keyof UpdateUserData;
      let currentValue;

      // Get current value from appropriate source
      if (fieldKey === "full_name" || fieldKey === "email") {
        currentValue = user[fieldKey];
      } else if (fieldKey === "date_of_birth") {
        // Format current date for comparison
        const currentDate = profile?.date_of_birth;
        if (currentDate) {
          try {
            const date = new Date(currentDate);
            currentValue = !isNaN(date.getTime())
              ? date.toISOString().split("T")[0]
              : "";
          } catch {
            currentValue = "";
          }
        } else {
          currentValue = "";
        }
      } else {
        // phone, nationality, occupation come from profile
        currentValue = profile?.[fieldKey as keyof typeof profile];
      }

      return formData[fieldKey] !== currentValue;
    });
  }, [formData, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/app/dashboard/tenant")}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  Profile Settings
                </h1>
                <p className="text-slate-600">
                  Manage your personal information and preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className={`text-slate-900 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.full_name
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`text-slate-900 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.email
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full text-slate-900 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.phone
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split("T")[0]}
                      className={`w-full text-slate-900 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.date_of_birth
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                    {errors.date_of_birth && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.date_of_birth}
                      </p>
                    )}
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className={`text-slate-900 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.nationality
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      placeholder="Enter your nationality"
                    />
                    {errors.nationality && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.nationality}
                      </p>
                    )}
                  </div>

                  {/* Occupation */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Occupation
                    </label>
                    <select
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className={`text-slate-900 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.occupation
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    >
                      {OCCUPATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.occupation && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.occupation}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-slate-200 pt-6">
                {/* Status Info */}
                {!hasChanges && (
                  <div className="mb-4 text-center">
                    <p className="text-sm text-slate-500">
                      Make changes to your profile to enable the update button
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={isLoading || !hasChanges}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Updating Profile...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Update Profile
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/app/dashboard/tenant")}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-slate-50"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
