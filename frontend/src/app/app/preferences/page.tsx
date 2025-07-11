"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAppSelector } from "@/app/store/hooks";
import { preferencesAPI } from "@/app/lib/api";
import {
  Home,
  MapPin,
  PoundSterling,
  Car,
  Coffee,
  Dumbbell,
  Wifi,
  Dog,
  Crown,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  ChevronRight,
  ChevronLeft,
  Heart,
} from "lucide-react";
import Link from "next/link";

interface PreferencesFormData {
  primary_postcode?: string;
  secondary_location?: string;
  commute_location?: string;
  commute_time_walk?: number;
  commute_time_cycle?: number;
  commute_time_tube?: number;
  move_in_date?: string;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  furnishing?: string;
  let_duration?: string;
  property_type?: string;
  building_style?: string[];
  designer_furniture?: boolean;
  house_shares?: string;
  date_property_added?: string;
  lifestyle_features?: string[];
  social_features?: string[];
  work_features?: string[];
  convenience_features?: string[];
  pet_friendly_features?: string[];
  luxury_features?: string[];
  hobbies?: string[];
  ideal_living_environment?: string;
  pets?: string;
  smoker?: boolean;
  additional_info?: string;
}

interface FormFieldErrors {
  [key: string]: string;
}

const LIFESTYLE_OPTIONS = [
  { value: "gym", label: "Fitness Center", icon: Dumbbell },
  { value: "pool", label: "Swimming Pool", icon: Home },
  { value: "garden", label: "Garden/Terrace", icon: Home },
  { value: "spa", label: "Spa/Wellness", icon: Home },
  { value: "cinema", label: "Cinema Room", icon: Home },
  { value: "library", label: "Library/Study", icon: Home },
];

const SOCIAL_OPTIONS = [
  { value: "communal-space", label: "Communal Areas", icon: Coffee },
  { value: "rooftop", label: "Rooftop Terrace", icon: Home },
  { value: "events", label: "Social Events", icon: Coffee },
  { value: "bbq", label: "BBQ Area", icon: Coffee },
  { value: "games-room", label: "Games Room", icon: Coffee },
];

const WORK_OPTIONS = [
  { value: "co-working", label: "Co-working Space", icon: Wifi },
  { value: "meeting-rooms", label: "Meeting Rooms", icon: Wifi },
  { value: "high-speed-wifi", label: "High-Speed WiFi", icon: Wifi },
  { value: "business-center", label: "Business Center", icon: Wifi },
];

const CONVENIENCE_OPTIONS = [
  { value: "parking", label: "Parking Space", icon: Car },
  { value: "storage", label: "Storage Space", icon: Home },
  { value: "laundry", label: "Laundry Facilities", icon: Home },
  { value: "concierge", label: "Concierge Service", icon: Home },
  { value: "security", label: "24/7 Security", icon: Home },
];

const PET_OPTIONS = [
  { value: "pet-park", label: "Pet Park", icon: Dog },
  { value: "pet-washing", label: "Pet Washing", icon: Dog },
  { value: "pet-sitting", label: "Pet Sitting", icon: Dog },
  { value: "pet-friendly", label: "Pet Friendly", icon: Dog },
];

const LUXURY_OPTIONS = [
  { value: "concierge", label: "Concierge", icon: Crown },
  { value: "valet", label: "Valet Service", icon: Crown },
  { value: "spa", label: "Luxury Spa", icon: Crown },
  { value: "wine-cellar", label: "Wine Cellar", icon: Crown },
  { value: "private-dining", label: "Private Dining", icon: Crown },
];

const BUILDING_STYLE_OPTIONS = [
  { value: "btr", label: "Build-to-Rent", icon: Home },
  { value: "co-living", label: "Co-Living", icon: Coffee },
  { value: "new-builds", label: "New Builds", icon: Home },
  { value: "period-homes", label: "Period Homes", icon: Home },
  { value: "luxury-apartments", label: "Luxury Apartments", icon: Crown },
  { value: "serviced-apartments", label: "Serviced Apartments", icon: Home },
];

interface RequiredLabelProps {
  children: React.ReactNode;
  required?: boolean;
  tooltip?: string;
}

const RequiredLabel: React.FC<RequiredLabelProps> = ({
  children,
  required = false,
  tooltip,
}) => (
  <div className="flex items-center gap-2 mb-2">
    <label className="block text-sm font-semibold text-slate-900">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {tooltip && (
      <div className="group relative">
        <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
          {tooltip}
        </div>
      </div>
    )}
  </div>
);

interface ErrorMessageProps {
  error?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
};

interface SelectFieldProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  children: React.ReactNode;
  [key: string]: any;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  required = false,
  tooltip,
  error,
  children,
  ...props
}) => (
  <div className="space-y-1">
    <RequiredLabel required={required} tooltip={tooltip}>
      {label}
    </RequiredLabel>
    <select
      className={`w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors ${
        error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""
      }`}
      {...props}
    >
      {children}
    </select>
    <ErrorMessage error={error} />
  </div>
);

const HOBBY_OPTIONS = [
  "Reading",
  "Cooking",
  "Fitness",
  "Music",
  "Travel",
  "Photography",
  "Gaming",
  "Art",
  "Sports",
  "Dancing",
  "Writing",
  "Gardening",
  "Yoga",
  "Cycling",
  "Running",
  "Swimming",
  "Hiking",
  "Movies",
  "Fashion",
  "Technology",
  "Languages",
  "Volunteering",
  "Shopping",
  "Socializing",
];

export default function PreferencesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [existingPreferences, setExistingPreferences] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const [backendErrors, setBackendErrors] = useState<FormFieldErrors>({});
  const [generalError, setGeneralError] = useState<string>("");
  const scrollPositionRef = useRef<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    defaultValues: {
      primary_postcode: "",
      secondary_location: "",
      commute_location: "",
      commute_time_walk: 15,
      commute_time_cycle: 20,
      commute_time_tube: 30,
      move_in_date: "",
      min_price: 1000,
      max_price: 5000,
      min_bedrooms: 1,
      max_bedrooms: 3,
      min_bathrooms: 1,
      max_bathrooms: 2,
      furnishing: "",
      let_duration: "",
      property_type: "",
      building_style: [],
      designer_furniture: false,
      house_shares: "show-all",
      date_property_added: "any",
      lifestyle_features: [],
      social_features: [],
      work_features: [],
      convenience_features: [],
      pet_friendly_features: [],
      luxury_features: [],
      hobbies: [],
      ideal_living_environment: "",
      pets: "",
      smoker: false,
      additional_info: "",
    },
  });

  const watchedData = watch();
  const watchedHobbies = watch("hobbies") || [];

  // Optimize watchedFeatures to prevent unnecessary re-renders
  const watchedFeatures = {
    lifestyle_features: watch("lifestyle_features") || [],
    social_features: watch("social_features") || [],
    work_features: watch("work_features") || [],
    convenience_features: watch("convenience_features") || [],
    pet_friendly_features: watch("pet_friendly_features") || [],
    luxury_features: watch("luxury_features") || [],
    building_style: watch("building_style") || [],
  };

  // Track scroll position continuously
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Preserve scroll position on re-renders
  useEffect(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/app/auth/login");
      return;
    }

    if (user.is_operator) {
      router.push("/app/dashboard/operator");
      return;
    }

    loadExistingPreferences();
  }, [isAuthenticated, user, router]);

  const loadExistingPreferences = async () => {
    try {
      const response = await preferencesAPI.get();
      setExistingPreferences(response.data);

      // Populate form with existing data
      Object.keys(response.data).forEach((key) => {
        if (response.data[key] !== null && response.data[key] !== undefined) {
          setValue(key as keyof PreferencesFormData, response.data[key]);
        }
      });
    } catch (error: unknown) {
      // No existing preferences or auth issue, use defaults
      console.log("No existing preferences found, using defaults");
      setExistingPreferences(null);
    }
  };

  const onSubmit = async (data: PreferencesFormData) => {
    // Prevent submission if not on final step
    if (step !== 11) {
      console.log(
        "❌ Form submission prevented - not on final step (current step:",
        step,
        ")"
      );
      return;
    }

    setLoading(true);
    setBackendErrors({});
    setGeneralError("");

    try {
      console.log("✅ Submitting preferences on step 11");

      // Convert "no-preference" values to null
      const processedData = Object.keys(data).reduce((acc, key) => {
        const value = data[key as keyof PreferencesFormData];
        if (value === "no-preference" || value === "") {
          acc[key as keyof PreferencesFormData] = null as any;
        } else {
          acc[key as keyof PreferencesFormData] = value;
        }
        return acc;
      }, {} as PreferencesFormData);

      const response = await preferencesAPI.create(processedData);

      // Check if the response status indicates success
      if (response.status >= 200 && response.status < 300) {
        console.log("✅ Preferences saved successfully");
        setSuccess(true);
        setTimeout(() => {
          router.push("/app/dashboard/tenant");
        }, 2000);
      } else {
        console.error("❌ Backend returned error status:", response.status);
        // Handle non-success status codes
        if (response.data?.errors) {
          const errors = response.data.errors;
          const fieldErrors: FormFieldErrors = {};

          // Map backend errors to form fields
          Object.keys(errors).forEach((field) => {
            fieldErrors[field] = Array.isArray(errors[field])
              ? errors[field][0]
              : errors[field];
          });

          setBackendErrors(fieldErrors);
        } else {
          setGeneralError(
            response.data?.message ||
              "Failed to save preferences. Please check your information and try again."
          );
        }
      }
    } catch (error: any) {
      console.error("Error saving preferences:", error);

      // Handle network or other errors
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const fieldErrors: FormFieldErrors = {};

        // Map backend errors to form fields
        Object.keys(errors).forEach((field) => {
          fieldErrors[field] = Array.isArray(errors[field])
            ? errors[field][0]
            : errors[field];
        });

        setBackendErrors(fieldErrors);
      } else {
        setGeneralError(
          error?.response?.data?.message ||
            "Failed to save preferences. Please check your information and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = useCallback(
    (category: keyof typeof watchedFeatures, feature: string) => {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;

      const current = watchedFeatures[category];
      const updated = current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature];

      setValue(category, updated, { shouldValidate: false, shouldDirty: true });

      // Use multiple methods to restore scroll position
      const restoreScroll = () => {
        window.scrollTo(0, scrollPositionRef.current);
      };

      // Immediate restore
      restoreScroll();

      // Restore after next tick
      requestAnimationFrame(restoreScroll);

      // Restore after potential layout shift
      setTimeout(restoreScroll, 0);
    },
    [watchedFeatures, setValue]
  );

  const toggleHobby = useCallback(
    (hobby: string) => {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;

      const current = watchedHobbies;
      const updated = current.includes(hobby)
        ? current.filter((h) => h !== hobby)
        : [...current, hobby];

      setValue("hobbies", updated, {
        shouldValidate: false,
        shouldDirty: true,
      });

      // Use multiple methods to restore scroll position
      const restoreScroll = () => {
        window.scrollTo(0, scrollPositionRef.current);
      };

      // Immediate restore
      restoreScroll();

      // Restore after next tick
      requestAnimationFrame(restoreScroll);

      // Restore after potential layout shift
      setTimeout(restoreScroll, 0);
    },
    [watchedHobbies, setValue]
  );

  const FeatureSelector = useCallback(
    ({
      title,
      options,
      category,
      icon: Icon,
    }: {
      title: string;
      options: Array<{ value: string; label: string; icon: any }>;
      category: keyof typeof watchedFeatures;
      icon: any;
    }) => {
      const selectedCount = watchedFeatures[category]?.length || 0;

      return (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
              <Icon className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="ml-auto">
              <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                {selectedCount} selected
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((option) => {
              const isSelected =
                watchedFeatures[category]?.includes(option.value) || false;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFeature(category, option.value);
                  }}
                  className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center">
                    <option.icon
                      className={`h-5 w-5 mr-3 ${
                        isSelected ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    },
    [watchedFeatures, toggleFeature]
  );

  const nextStep = () => {
    console.log("📍 Next step clicked, current step:", step);
    if (step < 11) {
      setStep(step + 1);
      console.log("✅ Moving to step:", step + 1);
    }
  };

  const prevStep = () => {
    console.log("📍 Previous step clicked, current step:", step);
    if (step > 1) {
      setStep(step - 1);
      console.log("✅ Moving to step:", step - 1);
    }
  };

  if (!user || !isAuthenticated) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Preferences Saved!
          </h2>
          <p className="text-slate-600 mb-8 text-lg leading-relaxed">
            Your preferences have been successfully updated. We'll use these to
            find your perfect home matches.
          </p>
          <div className="w-full bg-slate-100 rounded-lg p-4">
            <p className="text-slate-600 text-sm">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app/dashboard/tenant"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Step {step} of 11
              </span>
              <span className="text-sm text-slate-500">
                {((step / 11) * 100).toFixed(0)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-slate-900 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 11) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {generalError && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-1">
                  Error Saving Preferences
                </h3>
                <p className="text-red-700">{generalError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {step === 1 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button - Empty spacer for step 1 */}
                <div className="w-32"></div>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-900">
                      Location & Commute
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Where you want to live and work
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <RequiredLabel tooltip="Your preferred area or postcode for living">
                    Primary Postcode
                  </RequiredLabel>
                  <input
                    {...register("primary_postcode")}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 placeholder-slate-500 bg-white"
                    placeholder="e.g., SW1A 1AA"
                  />
                  <ErrorMessage error={backendErrors.primary_postcode} />
                </div>

                <div className="space-y-1">
                  <RequiredLabel tooltip="Alternative area you'd consider">
                    Secondary Location
                  </RequiredLabel>
                  <input
                    {...register("secondary_location")}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 placeholder-slate-500 bg-white"
                    placeholder="e.g., Central London"
                  />
                  <ErrorMessage error={backendErrors.secondary_location} />
                </div>

                <div className="space-y-1">
                  <RequiredLabel tooltip="Where you commute to for work">
                    Commute Location
                  </RequiredLabel>
                  <input
                    {...register("commute_location")}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 placeholder-slate-500 bg-white"
                    placeholder="e.g., Canary Wharf"
                  />
                  <ErrorMessage error={backendErrors.commute_location} />
                </div>

                <div className="space-y-1">
                  <RequiredLabel tooltip="When you want to move in">
                    Move-in Date
                  </RequiredLabel>
                  <input
                    type="date"
                    {...register("move_in_date")}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 bg-white"
                  />
                  <ErrorMessage error={backendErrors.move_in_date} />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Maximum Commute Times
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <RequiredLabel tooltip="Maximum walking time to work or transport">
                      Walking (minutes)
                    </RequiredLabel>
                    <input
                      type="number"
                      {...register("commute_time_walk", {
                        valueAsNumber: true,
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 placeholder-slate-500 bg-white"
                      placeholder="15"
                      min="1"
                      max="120"
                    />
                    <ErrorMessage error={backendErrors.commute_time_walk} />
                  </div>

                  <div className="space-y-1">
                    <RequiredLabel tooltip="Maximum cycling time to work">
                      Cycling (minutes)
                    </RequiredLabel>
                    <input
                      type="number"
                      {...register("commute_time_cycle", {
                        valueAsNumber: true,
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 placeholder-slate-500 bg-white"
                      placeholder="20"
                      min="1"
                      max="120"
                    />
                    <ErrorMessage error={backendErrors.commute_time_cycle} />
                  </div>

                  <div className="space-y-1">
                    <RequiredLabel tooltip="Maximum tube/public transport time">
                      Tube (minutes)
                    </RequiredLabel>
                    <input
                      type="number"
                      {...register("commute_time_tube", {
                        valueAsNumber: true,
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 placeholder-slate-500 bg-white"
                      placeholder="30"
                      min="1"
                      max="120"
                    />
                    <ErrorMessage error={backendErrors.commute_time_tube} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <PoundSterling className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-900">
                      Budget & Property Details
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Your budget and property requirements
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Budget Range
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <RequiredLabel tooltip="Minimum monthly rent you're willing to pay">
                      Minimum Price (£/month)
                    </RequiredLabel>
                    <input
                      type="number"
                      {...register("min_price", { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 placeholder-slate-500 bg-white"
                      placeholder="1000"
                      min="500"
                      max="10000"
                    />
                    <ErrorMessage error={backendErrors.min_price} />
                  </div>

                  <div className="space-y-1">
                    <RequiredLabel tooltip="Maximum monthly rent you can afford">
                      Maximum Price (£/month)
                    </RequiredLabel>
                    <input
                      type="number"
                      {...register("max_price", { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 placeholder-slate-500 bg-white"
                      placeholder="5000"
                      min="500"
                      max="20000"
                    />
                    <ErrorMessage error={backendErrors.max_price} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <RequiredLabel tooltip="Minimum number of bedrooms">
                    Bedrooms (min)
                  </RequiredLabel>
                  <select
                    {...register("min_bedrooms", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 bg-white"
                  >
                    <option value="" className="text-slate-900">
                      No Preference
                    </option>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num} className="text-slate-900">
                        {num} bedroom{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  <ErrorMessage error={backendErrors.min_bedrooms} />
                </div>

                <div className="space-y-1">
                  <RequiredLabel tooltip="Maximum number of bedrooms">
                    Bedrooms (max)
                  </RequiredLabel>
                  <select
                    {...register("max_bedrooms", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors text-slate-900 bg-white"
                  >
                    <option value="" className="text-slate-900">
                      No Preference
                    </option>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num} className="text-slate-900">
                        {num} bedroom{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  <ErrorMessage error={backendErrors.max_bedrooms} />
                </div>

                <SelectField
                  label="Furnishing"
                  tooltip="Whether you prefer furnished or unfurnished properties"
                  error={backendErrors.furnishing}
                  {...register("furnishing")}
                >
                  <option value="furnished" className="text-slate-900">
                    Furnished
                  </option>
                  <option value="unfurnished" className="text-slate-900">
                    Unfurnished
                  </option>
                  <option value="part-furnished" className="text-slate-900">
                    Part Furnished
                  </option>
                  <option value="no-preference" className="text-slate-900">
                    No Preference
                  </option>
                </SelectField>

                <SelectField
                  label="Property Type"
                  tooltip="What type of property you're looking for"
                  error={backendErrors.property_type}
                  {...register("property_type")}
                >
                  <option value="any" className="text-slate-900">
                    Any
                  </option>
                  <option value="flats" className="text-slate-900">
                    Flats
                  </option>
                  <option value="houses" className="text-slate-900">
                    Houses
                  </option>
                  <option value="studio" className="text-slate-900">
                    Studio
                  </option>
                  <option value="others" className="text-slate-900">
                    Others (specify)
                  </option>
                </SelectField>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Home className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-black">
                      Building Style Preferences
                    </h2>
                    <p className="text-black text-sm">
                      Choose your preferred building types
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <FeatureSelector
                title="Building Styles"
                options={BUILDING_STYLE_OPTIONS}
                category="building_style"
                icon={Home}
              />
            </section>
          )}

          {step === 4 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mr-4">
                    <Dumbbell className="h-6 w-6 text-pink-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-black">
                      Lifestyle & Wellness
                    </h2>
                    <p className="text-black text-sm">
                      Select wellness and fitness amenities that matter to you
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <FeatureSelector
                title="Lifestyle & Wellness"
                options={LIFESTYLE_OPTIONS}
                category="lifestyle_features"
                icon={Dumbbell}
              />
            </section>
          )}

          {step === 5 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <Coffee className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-black">
                      Social & Community
                    </h2>
                    <p className="text-black text-sm">
                      Choose social spaces and community features you'd enjoy
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <FeatureSelector
                title="Social & Community"
                options={SOCIAL_OPTIONS}
                category="social_features"
                icon={Coffee}
              />
            </section>
          )}

          {step === 6 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Wifi className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-black">
                      Work & Study
                    </h2>
                    <p className="text-black text-sm">
                      Select work and study facilities you need for productivity
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <FeatureSelector
                title="Work & Study"
                options={WORK_OPTIONS}
                category="work_features"
                icon={Wifi}
              />
            </section>
          )}

          {step === 7 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <Car className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-black">
                      Convenience
                    </h2>
                    <p className="text-black text-sm">
                      Choose convenience features that make daily life easier
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <FeatureSelector
                title="Convenience"
                options={CONVENIENCE_OPTIONS}
                category="convenience_features"
                icon={Car}
              />
            </section>
          )}

          {step === 8 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Dog className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-black">
                      Pet-Friendly
                    </h2>
                    <p className="text-black text-sm">
                      Select pet-friendly amenities if you have or plan to get
                      pets
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <FeatureSelector
                title="Pet-Friendly"
                options={PET_OPTIONS}
                category="pet_friendly_features"
                icon={Dog}
              />
            </section>
          )}

          {step === 9 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                    <Crown className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-black">
                      Luxury & Premium
                    </h2>
                    <p className="text-black text-sm">
                      Choose luxury amenities and premium services you value
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <FeatureSelector
                title="Luxury & Premium"
                options={LUXURY_OPTIONS}
                category="luxury_features"
                icon={Crown}
              />
            </section>
          )}

          {step === 10 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Heart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-black">
                      Personal Preferences
                    </h2>
                    <p className="text-black text-sm">
                      Tell us about yourself and your living preferences
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Hobbies */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-3">
                    Hobbies & Interests
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Select activities you enjoy (helps match you with
                    like-minded housemates)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {HOBBY_OPTIONS.map((hobby) => (
                      <button
                        key={hobby}
                        type="button"
                        onClick={() => toggleHobby(hobby)}
                        className={`px-4 py-3 text-sm rounded-xl border-2 transition-all duration-200 font-medium ${
                          watchedHobbies.includes(hobby)
                            ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300"
                        }`}
                      >
                        {hobby}
                      </button>
                    ))}
                  </div>
                  {watchedHobbies.length > 0 && (
                    <p className="text-sm text-blue-600 mt-3 font-medium">
                      ✓ {watchedHobbies.length} interest
                      {watchedHobbies.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>

                {/* Living Environment & Personal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SelectField
                    label="Ideal Living Environment"
                    tooltip="The type of household atmosphere you prefer"
                    error={backendErrors.ideal_living_environment}
                    {...register("ideal_living_environment")}
                  >
                    <option value="quiet-professional" className="text-black">
                      Quiet Professional
                    </option>
                    <option value="social-friendly" className="text-black">
                      Social & Friendly
                    </option>
                    <option value="family-oriented" className="text-black">
                      Family Oriented
                    </option>
                    <option value="student-lifestyle" className="text-black">
                      Student Lifestyle
                    </option>
                    <option value="creative-artistic" className="text-black">
                      Creative & Artistic
                    </option>
                    <option value="no-preference" className="text-black">
                      No Preference
                    </option>
                  </SelectField>

                  <SelectField
                    label="Pets"
                    tooltip="Important for matching with pet-friendly accommodations"
                    error={backendErrors.pets}
                    {...register("pets")}
                  >
                    <option value="none" className="text-black">
                      No Pets
                    </option>
                    <option value="dog" className="text-black">
                      Dog
                    </option>
                    <option value="cat" className="text-black">
                      Cat
                    </option>
                    <option value="small-pets" className="text-black">
                      Small Pets (Birds, Fish, etc.)
                    </option>
                    <option value="planning-to-get" className="text-black">
                      Planning to Get Pet
                    </option>
                  </SelectField>
                </div>

                {/* Smoker */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <input
                    {...register("smoker")}
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <label className="text-base font-medium text-black cursor-pointer">
                      I am a smoker
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      This helps us match you with smoking-friendly
                      accommodations
                    </p>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-3">
                    About You
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Tell potential landlords and housemates about yourself
                    (optional)
                  </p>
                  <textarea
                    {...register("additional_info")}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors resize-none text-black placeholder-gray-500 bg-white"
                    placeholder="e.g., I'm a quiet professional who enjoys cooking and reading. I keep a clean living space and am always respectful of neighbors. I'm looking for a peaceful home environment where I can relax after work..."
                  />
                  <ErrorMessage error={backendErrors.additional_info} />
                </div>
              </div>
            </section>
          )}

          {step === 11 && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Centered Title */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-black">
                      Review & Confirm
                    </h2>
                    <p className="text-black text-sm">
                      Review your preferences before saving
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-2 rounded-lg transition-colors min-w-[160px] flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>

              {/* Review Content */}
              <div className="space-y-8">
                {/* Location & Commute */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900">
                      Location & Commute
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">
                        Primary Location:
                      </span>
                      <span className="ml-2 text-blue-700">
                        {watch("primary_postcode") || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">
                        Secondary Location:
                      </span>
                      <span className="ml-2 text-blue-700">
                        {watch("secondary_location") || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">
                        Commute Location:
                      </span>
                      <span className="ml-2 text-blue-700">
                        {watch("commute_location") || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">
                        Move-in Date:
                      </span>
                      <span className="ml-2 text-blue-700">
                        {watch("move_in_date") || "Not specified"}
                      </span>
                    </div>
                  </div>
                  {(watch("commute_time_walk") ||
                    watch("commute_time_cycle") ||
                    watch("commute_time_tube")) && (
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                      <span className="font-medium text-blue-800">
                        Max Commute Times:
                      </span>
                      <div className="flex gap-4 mt-1 text-sm text-blue-700">
                        {watch("commute_time_walk") && (
                          <span>Walk: {watch("commute_time_walk")}min</span>
                        )}
                        {watch("commute_time_cycle") && (
                          <span>Cycle: {watch("commute_time_cycle")}min</span>
                        )}
                        {watch("commute_time_tube") && (
                          <span>Tube: {watch("commute_time_tube")}min</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Budget & Property Details */}
                <div className="bg-green-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <PoundSterling className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-900">
                      Budget & Property Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-800">
                        Budget Range:
                      </span>
                      <span className="ml-2 text-green-700">
                        £{watch("min_price") || 0} - £{watch("max_price") || 0}{" "}
                        /month
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">
                        Bedrooms:
                      </span>
                      <span className="ml-2 text-green-700">
                        {watch("min_bedrooms") || 0} -{" "}
                        {watch("max_bedrooms") || 0}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">
                        Property Type:
                      </span>
                      <span className="ml-2 text-green-700 capitalize">
                        {watch("property_type")?.replace("-", " ") ||
                          "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">
                        Furnishing:
                      </span>
                      <span className="ml-2 text-green-700 capitalize">
                        {watch("furnishing")?.replace("-", " ") ||
                          "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Building Styles */}
                {watch("building_style")?.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <Home className="h-5 w-5 text-purple-600 mr-2" />
                      <h3 className="text-lg font-semibold text-purple-900">
                        Building Style Preferences
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {watch("building_style")?.map((style) => (
                        <span
                          key={style}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                        >
                          {BUILDING_STYLE_OPTIONS.find(
                            (opt) => opt.value === style
                          )?.label || style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lifestyle Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lifestyle & Wellness */}
                  {watch("lifestyle_features")?.length > 0 && (
                    <div className="bg-pink-50 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <Dumbbell className="h-5 w-5 text-pink-600 mr-2" />
                        <h3 className="text-base font-semibold text-pink-900">
                          Lifestyle & Wellness
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {watch("lifestyle_features")?.map((feature) => (
                          <div key={feature} className="text-sm text-pink-800">
                            •{" "}
                            {LIFESTYLE_OPTIONS.find(
                              (opt) => opt.value === feature
                            )?.label || feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social & Community */}
                  {watch("social_features")?.length > 0 && (
                    <div className="bg-orange-50 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <Coffee className="h-5 w-5 text-orange-600 mr-2" />
                        <h3 className="text-base font-semibold text-orange-900">
                          Social & Community
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {watch("social_features")?.map((feature) => (
                          <div
                            key={feature}
                            className="text-sm text-orange-800"
                          >
                            •{" "}
                            {SOCIAL_OPTIONS.find((opt) => opt.value === feature)
                              ?.label || feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work & Study */}
                  {watch("work_features")?.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <Wifi className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="text-base font-semibold text-blue-900">
                          Work & Study
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {watch("work_features")?.map((feature) => (
                          <div key={feature} className="text-sm text-blue-800">
                            •{" "}
                            {WORK_OPTIONS.find((opt) => opt.value === feature)
                              ?.label || feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Convenience */}
                  {watch("convenience_features")?.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <Car className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="text-base font-semibold text-green-900">
                          Convenience
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {watch("convenience_features")?.map((feature) => (
                          <div key={feature} className="text-sm text-green-800">
                            •{" "}
                            {CONVENIENCE_OPTIONS.find(
                              (opt) => opt.value === feature
                            )?.label || feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pet-Friendly */}
                  {watch("pet_friendly_features")?.length > 0 && (
                    <div className="bg-purple-50 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <Dog className="h-5 w-5 text-purple-600 mr-2" />
                        <h3 className="text-base font-semibold text-purple-900">
                          Pet-Friendly
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {watch("pet_friendly_features")?.map((feature) => (
                          <div
                            key={feature}
                            className="text-sm text-purple-800"
                          >
                            •{" "}
                            {PET_OPTIONS.find((opt) => opt.value === feature)
                              ?.label || feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Luxury & Premium */}
                  {watch("luxury_features")?.length > 0 && (
                    <div className="bg-yellow-50 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <Crown className="h-5 w-5 text-yellow-600 mr-2" />
                        <h3 className="text-base font-semibold text-yellow-900">
                          Luxury & Premium
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {watch("luxury_features")?.map((feature) => (
                          <div
                            key={feature}
                            className="text-sm text-yellow-800"
                          >
                            •{" "}
                            {LUXURY_OPTIONS.find((opt) => opt.value === feature)
                              ?.label || feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Personal Preferences */}
                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <Heart className="h-5 w-5 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-purple-900">
                      Personal Preferences
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {/* Hobbies */}
                    {watch("hobbies")?.length > 0 && (
                      <div>
                        <span className="font-medium text-purple-800">
                          Hobbies & Interests:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {watch("hobbies")?.map((hobby) => (
                            <span
                              key={hobby}
                              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                            >
                              {hobby}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Living Environment & Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {watch("ideal_living_environment") && (
                        <div>
                          <span className="font-medium text-purple-800">
                            Living Environment:
                          </span>
                          <span className="ml-2 text-purple-700 capitalize">
                            {watch("ideal_living_environment")?.replace(
                              "-",
                              " "
                            )}
                          </span>
                        </div>
                      )}
                      {watch("pets") && (
                        <div>
                          <span className="font-medium text-purple-800">
                            Pets:
                          </span>
                          <span className="ml-2 text-purple-700 capitalize">
                            {watch("pets")?.replace("-", " ")}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-purple-800">
                          Smoker:
                        </span>
                        <span className="ml-2 text-purple-700">
                          {watch("smoker") ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {watch("additional_info") && (
                      <div>
                        <span className="font-medium text-purple-800">
                          About You:
                        </span>
                        <p className="mt-2 text-sm text-purple-700 bg-purple-100 p-3 rounded-lg">
                          {watch("additional_info")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to Save Your Preferences?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Once saved, we'll use these preferences to find your perfect
                    property matches. You can always update them later from your
                    profile.
                  </p>
                </div>
              </div>
            </section>
          )}
        </form>
      </div>
    </div>
  );
}
