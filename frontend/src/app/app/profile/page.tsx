"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  updateUser,
} from "../../store/slices/authSlice";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";
import { GlassmorphismDatePicker } from "../../components/preferences/ui/GlassmorphismDatePicker";
import { GlassmorphismDropdown } from "../../components/preferences/ui/GlassmorphismDropdown";
import { ErrorMessage } from "../../components/preferences/ui/ErrorMessage";
import { User as UserIcon, AlertCircle, CheckCircle2 } from "lucide-react";

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

// Local InputField component with proper centering
interface LocalInputFieldProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  max?: string;
}

const LocalInputField: React.FC<LocalInputFieldProps> = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  required = false,
  error,
  max,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasValue = !!value;

  useEffect(() => {
    if (!isInitialized) {
      setTimeout(() => setIsInitialized(true), 100);
    }
  }, [isInitialized]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          max={max}
          className={`w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent border-0 shadow-sm ${
            error ? "ring-2 ring-red-400 focus:ring-red-500" : ""
          }`}
          placeholder=""
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <label
          className={`absolute left-6 pointer-events-none ${
            isInitialized ? "transition-all duration-200" : ""
          } ${
            isFocused || hasValue
              ? "top-3 text-xs text-gray-500"
              : "top-1/2 -translate-y-1/2 text-base text-gray-400"
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      <ErrorMessage error={error} />
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<UpdateUserData>({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    nationality: "",
    occupation: "",
  });

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    // Check if token exists in localStorage
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    // If no token or not authenticated, redirect to landing page
    if (!token || !isAuthenticated) {
      router.replace("/app/auth/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user && !isEditing) {
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
  }, [user, isEditing]);

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

  // If not authenticated or no token, don't render anything (redirect will happen)
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (!token || !isAuthenticated) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Get profile data based on user role
  const profile =
    user.role === "tenant" ? user.tenantProfile : user.operatorProfile;

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        searchTerm=""
        onSearchChange={() => {}}
        showSearchInput={false}
        showPreferencesButton={false}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            The type of household atmosphere you prefer
          </p>
        </div>

        {/* Avatar Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const icon = parent.querySelector(".fallback-icon");
                    if (icon) {
                      (icon as HTMLElement).style.display = "block";
                    }
                  }
                }}
              />
            ) : null}
            <UserIcon
              className={`w-12 h-12 text-gray-400 ${
                user?.avatar_url ? "fallback-icon hidden" : ""
              }`}
            />
          </div>
          <div className="space-y-2">
            {user?.provider === "google" && (
              <p className="text-sm text-gray-500">
                Profile picture from Google
              </p>
            )}
            <button className="text-gray-500 hover:text-gray-700 font-medium border border-gray-300 px-4 py-2 rounded-lg transition-colors">
              Change avatar
            </button>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="bg-gray-50 rounded-3xl p-8 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black">Personal Info</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-700 hover:text-gray-900 font-medium border border-gray-300 px-6 py-3 rounded-full transition-colors"
              >
                Edit info
              </button>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <LocalInputField
                label="Full name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                error={errors.full_name}
              />

              {/* Email */}
              <LocalInputField
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                error={errors.email}
              />

              {/* Phone Number */}
              <LocalInputField
                label="Phone number (option)"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={errors.phone}
              />

              {/* Date of Birth */}
              <GlassmorphismDatePicker
                label="Date of Birth"
                value={formData.date_of_birth}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, date_of_birth: date }))
                }
                error={errors.date_of_birth}
                maxDate={new Date()}
                minDate={new Date("1900-01-01")}
              />

              {/* Nationality */}
              <LocalInputField
                label="Nationality"
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                error={errors.nationality}
              />

              {/* Occupation */}
              <GlassmorphismDropdown
                label="Occupation"
                value={formData.occupation}
                options={OCCUPATION_OPTIONS}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    occupation: value as string,
                  }))
                }
                error={errors.occupation}
                placeholder="Select occupation"
              />

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-4 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !hasChanges}
                  className="flex-1 bg-black text-white px-6 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    "Save info"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Full name</div>
                <div className="text-black font-medium">
                  {formData.full_name || "Not provided"}
                </div>
              </div>

              {/* Email */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Email</div>
                <div className="text-black font-medium">
                  {formData.email || "Not provided"}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  Phone number <span className="text-gray-400">(option)</span>
                </div>
                <div className="text-black font-medium">
                  {formData.phone || "Not provided"}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Date of Birth</div>
                <div className="text-black font-medium">
                  {formatDate(formData.date_of_birth) || "Not provided"}
                </div>
              </div>

              {/* Nationality */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Nationality</div>
                <div className="text-black font-medium">
                  {formData.nationality || "Not provided"}
                </div>
              </div>

              {/* Occupation */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Occupation</div>
                <div className="text-black font-medium">
                  {OCCUPATION_OPTIONS.find(
                    (opt) => opt.value === formData.occupation
                  )?.label || "Not provided"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
