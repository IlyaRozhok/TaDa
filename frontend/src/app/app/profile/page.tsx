"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { authAPI } from "../../lib/api";

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  address?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  address?: string;
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
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingFieldRef = useRef<{ field: keyof UpdateUserData; value: unknown } | null>(null);
  const initialFormDataRef = useRef<UpdateUserData | null>(null);

  const [formData, setFormData] = useState<UpdateUserData>({
    first_name: "",
    last_name: "",
    address: "",
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

      const initialData = {
        first_name: (profile as any)?.first_name || "",
        last_name: (profile as any)?.last_name || "",
        address: (profile as any)?.address || "",
        email: user.email || "",
        phone: profile?.phone || "",
        date_of_birth: formattedDateOfBirth,
        nationality: profile?.nationality || "",
        occupation: profile?.occupation || "",
      };
      setFormData(initialData);
      if (!isEditing) {
        initialFormDataRef.current = initialData;
      }
    }
  }, [user, isEditing]);

  // Save single field to API
  const saveSingleField = useCallback(async (
    field: keyof UpdateUserData,
    value: unknown
  ) => {
    if (!user) {
      return;
    }

    try {
      // Get current value from user/profile
      const profile = user.role === "tenant" ? user.tenantProfile : user.operatorProfile;
      let currentValue: unknown;

      if (field === "email") {
        currentValue = user[field];
      } else if (field === "date_of_birth") {
        const currentDate = (profile as any)?.date_of_birth;
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
        currentValue = (profile as any)?.[field];
      }

      // Check if value actually changed
      const hasChanged = value !== currentValue;

      if (!hasChanged) {
        return; // No change, skip save
      }

      // Prepare update data
      const updateData: UpdateUserData = { [field]: value } as UpdateUserData;

      // Update profile via API
      await authAPI.updateProfile(updateData);
      dispatch(updateUser(updateData));

      // Update initial form data reference
      if (initialFormDataRef.current) {
        initialFormDataRef.current = {
          ...initialFormDataRef.current,
          [field]: value,
        };
      }
    } catch (error) {
      console.error(`Failed to save field ${field as string}:`, error);
      // Silent fail - don't show toast
    }
  }, [user, dispatch]);

  const handleInputChange = useCallback((
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

    // Auto-save the field after debounce (only when editing)
    if (isEditing) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      pendingFieldRef.current = { field: name as keyof UpdateUserData, value };

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingFieldRef.current) {
          saveSingleField(pendingFieldRef.current.field, pendingFieldRef.current.value);
          pendingFieldRef.current = null;
        }
      }, 500); // 500ms debounce
    }
  }, [errors, isEditing, saveSingleField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Flush any pending saves before submitting
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (pendingFieldRef.current) {
      await saveSingleField(pendingFieldRef.current.field, pendingFieldRef.current.value);
      pendingFieldRef.current = null;
    }

    // Exit edit mode
    setIsEditing(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
              {/* First Name */}
              <LocalInputField
                label="First Name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                error={errors.first_name}
              />

              {/* Last Name */}
              <LocalInputField
                label="Last Name"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                error={errors.last_name}
              />

              {/* Address */}
              <LocalInputField
                label="Address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                error={errors.address}
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

              {/* Phone Number */}
              <LocalInputField
                label="Phone number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={errors.phone}
              />

              {/* Date of Birth */}
              <GlassmorphismDatePicker
                label="Date of Birth"
                value={formData.date_of_birth || null}
                onChange={(date) => {
                  setFormData((prev) => ({ ...prev, date_of_birth: date }));
                  // Auto-save date of birth
                  if (isEditing) {
                    if (saveTimeoutRef.current) {
                      clearTimeout(saveTimeoutRef.current);
                    }
                    pendingFieldRef.current = { field: "date_of_birth", value: date };
                    saveTimeoutRef.current = setTimeout(() => {
                      if (pendingFieldRef.current) {
                        saveSingleField(pendingFieldRef.current.field, pendingFieldRef.current.value);
                        pendingFieldRef.current = null;
                      }
                    }, 500);
                  }
                }}
                error={errors.date_of_birth}
                maxDate={new Date()}
                minDate={new Date("1900-01-01")}
              />

              {/* Occupation */}
              <GlassmorphismDropdown
                label="Occupation"
                value={formData.occupation}
                options={OCCUPATION_OPTIONS}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    occupation: value as string,
                  }));
                  // Auto-save occupation
                  if (isEditing) {
                    if (saveTimeoutRef.current) {
                      clearTimeout(saveTimeoutRef.current);
                    }
                    pendingFieldRef.current = { field: "occupation", value: value as string };
                    saveTimeoutRef.current = setTimeout(() => {
                      if (pendingFieldRef.current) {
                        saveSingleField(pendingFieldRef.current.field, pendingFieldRef.current.value);
                        pendingFieldRef.current = null;
                      }
                    }, 500);
                  }
                }}
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
                  className="flex-1 bg-black text-white px-6 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Done
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* First Name */}
              <div>
                <div className="text-sm text-gray-600 mb-1">First Name</div>
                <div className="text-black font-medium">
                  {formData.first_name || "Not provided"}
                </div>
              </div>

              {/* Last Name */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Last Name</div>
                <div className="text-black font-medium">
                  {formData.last_name || "Not provided"}
                </div>
              </div>

              {/* Address */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Address</div>
                <div className="text-black font-medium">
                  {formData.address || "Not provided"}
                </div>
              </div>

              {/* Nationality */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Nationality</div>
                <div className="text-black font-medium">
                  {formData.nationality || "Not provided"}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Phone number</div>
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
