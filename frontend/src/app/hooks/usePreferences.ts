import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAppSelector } from "@/app/store/hooks";
import { preferencesAPI } from "@/app/lib/api";
import {
  PreferencesFormData,
  FormFieldErrors,
  PreferencesState,
} from "@/app/types/preferences";
import { TOTAL_STEPS_NEW } from "@/app/constants/preferences";
import { waitForSessionManager } from "@/app/components/providers/SessionManager";
import { blockNavigation } from "@/app/utils/navigationGuard";

const TOTAL_STEPS = TOTAL_STEPS_NEW; // Use the new version with 16 steps

export const usePreferences = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();
  const scrollPositionRef = useRef<number>(0);
  const hasCheckedAuthRef = useRef<boolean>(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  const [state, setState] = useState<PreferencesState>(() => {
    // Initialize step from localStorage if available
    const savedStep =
      typeof window !== "undefined"
        ? localStorage.getItem("preferencesStep")
        : null;
    let initialStep = 1;

    if (savedStep) {
      const parsedStep = parseInt(savedStep, 10);
      // Validate step is within bounds
      if (parsedStep >= 1 && parsedStep <= TOTAL_STEPS) {
        initialStep = parsedStep;
      }
    }

    return {
      loading: false,
      step: initialStep,
      existingPreferences: null,
      success: false,
      backendErrors: {},
      generalError: "",
    };
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    defaultValues: {
      primary_postcode: "",
      secondary_location: "no-preference",
      commute_location: "no-preference",
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
      furnishing: "no-preference",
      let_duration: "",
      property_type: [],
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
      ideal_living_environment: [],
      pets: "",
      smoker: "no-preference",
      additional_info: "",
      // Step 2 - New fields
      deposit_preferences: [],
      // Step 3 - New fields (all multi-select)
      property_type_preferences: [],
      rooms_preferences: [],
      bathrooms_preferences: [],
      furnishing_preferences: [],
      outdoor_space_preferences: [],
      min_square_meters: 15,
      max_square_meters: 45,
      // Step 4 - New fields
      building_style_preferences: [],
      selected_duration: "",
      selected_bills: "",
      // Step 5 - New fields
      tenant_type_preferences: [],
      // Step 6 - New fields
      pet_type_preferences: [],
      number_of_pets: "",
      dog_size: "",
      // Step 7 - New fields
      amenities_preferences: [],
      additional_preferences: [],
    },
  });

  const watchedData = watch();

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Preserve scroll position on re-renders
  useEffect(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  });

  // Save current step to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferencesStep", state.step.toString());
    }
  }, [state.step]);

  // Wait for session initialization
  useEffect(() => {
    const initSession = async () => {
      try {
        await waitForSessionManager();
        setSessionInitialized(true);
      } catch (error) {
        console.error("Failed to wait for session manager:", error);
        setSessionInitialized(true); // Still mark as initialized to prevent blocking
      }
    };
    initSession();
  }, []);

  // Authentication check and load preferences
  useEffect(() => {
    // Wait for session to be initialized first
    if (!sessionInitialized) {
      console.log("⏳ Waiting for session initialization in usePreferences...");
      return;
    }

    // Skip if we've already checked auth to prevent unwanted redirects
    if (hasCheckedAuthRef.current && isAuthenticated && user) {
      return;
    }

    // Only redirect if we've checked authentication and user is definitely not authenticated
    // Important: check that session is initialized before checking authentication
    if (sessionInitialized && isAuthenticated === false) {
      console.log(
        "🔒 User not authenticated, redirecting to login from usePreferences"
      );
      router.push("/app/auth/login");
      return;
    }

    // Only proceed if we have a user
    if (!user) {
      console.log("⏳ Waiting for user data in usePreferences...");
      return;
    }

    // Check if operator role
    if (user.roles?.includes("operator")) {
      console.log("👷 User is operator, redirecting from usePreferences");
      router.push("/app/dashboard/operator");
      return;
    }

    // Mark as checked to prevent re-runs
    hasCheckedAuthRef.current = true;

    // Load existing preferences for tenant
    console.log("📄 Loading preferences for tenant:", user.email);
    loadExistingPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionInitialized, isAuthenticated, user?.id]); // Include sessionInitialized in dependencies

  const loadExistingPreferences = async () => {
    try {
      const response = await preferencesAPI.get();

      if (response.data) {
        setState((prev) => ({ ...prev, existingPreferences: response.data }));

        // Populate form with existing data
        Object.keys(response.data).forEach((key) => {
          const value = response.data[key];

          // Skip null/undefined values and special fields
          if (
            value === null ||
            value === undefined ||
            key === "id" ||
            key === "user_id" ||
            key === "user" ||
            key === "created_at" ||
            key === "updated_at"
          ) {
            return;
          }

          // Handle date fields
          if (key === "move_in_date" && value) {
            // Convert date to YYYY-MM-DD format for DateRangePicker
            const dateValue = value.split("T")[0];
            setValue(key as keyof PreferencesFormData, dateValue);
            return;
          }

          if (key === "move_out_date" && value) {
            // Convert date to YYYY-MM-DD format for DateRangePicker
            const dateValue = value.split("T")[0];

            // Only set move_out_date if it's different from move_in_date
            const moveInDate = response.data.move_in_date;
            if (moveInDate && moveInDate.split("T")[0] === dateValue) {
              // Same date as move_in_date, don't set move_out_date (single date selection)
              setValue("move_out_date", undefined);
            } else {
              // Different date, set as range
              setValue(key as keyof PreferencesFormData, dateValue);
            }
            return;
          }

          // Handle array fields
          const arrayFields = [
            "property_type",
            "building_style",
            "lifestyle_features",
            "social_features",
            "work_features",
            "convenience_features",
            "pet_friendly_features",
            "luxury_features",
            "hobbies",
          ];

          if (arrayFields.includes(key)) {
            if (typeof value === "string") {
              // Handle old string format or comma-separated values
              const arrayValue = value.includes(",")
                ? value.split(",").map((v) => v.trim())
                : [value];

              setValue(key as keyof PreferencesFormData, arrayValue);
            } else if (Array.isArray(value)) {
              setValue(key as keyof PreferencesFormData, value);
            }
            return;
          }

          // Handle boolean fields
          if (key === "designer_furniture") {
            const boolValue = value === true || value === "true" || value === 1;

            setValue(key as keyof PreferencesFormData, boolValue);
            return;
          }

          // Handle all other fields

          setValue(key as keyof PreferencesFormData, value);
        });
      }
    } catch {
      // Check if this is a 404 (no preferences yet) or another error
      setState((prev) => ({ ...prev, existingPreferences: null }));
    }
  };

  const updateField = useCallback(
    (
      field: keyof PreferencesFormData,
      value: string | number | boolean | string[] | undefined
    ) => {
      setValue(field, value, { shouldValidate: false, shouldDirty: true });
    },
    [setValue]
  );

  const toggleFeature = useCallback(
    (category: keyof PreferencesFormData, feature: string) => {
      scrollPositionRef.current = window.scrollY;

      const current = (watchedData[category] as string[]) || [];
      const updated = current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature];

      setValue(category, updated, { shouldValidate: false, shouldDirty: true });

      // Restore scroll position
      const restoreScroll = () => {
        window.scrollTo(0, scrollPositionRef.current);
      };

      restoreScroll();
      requestAnimationFrame(restoreScroll);
      setTimeout(restoreScroll, 0);
    },
    [watchedData, setValue]
  );

  const nextStep = useCallback(() => {
    if (state.step < TOTAL_STEPS) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  }, [state.step]);

  const prevStep = useCallback(() => {
    if (state.step > 1) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  }, [state.step]);

  const resetToFirstStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: 1 }));
    // Clear saved step when resetting
    if (typeof window !== "undefined") {
      localStorage.removeItem("preferencesStep");
    }
  }, []);

  const onSubmit = async (data: PreferencesFormData) => {
    setState((prev) => ({
      ...prev,
      loading: true,
      backendErrors: {},
      generalError: "",
    }));

    try {
      // Convert "no-preference" values to null and handle empty arrays
      // Exception: keep "no-preference" for furnishing field
      const processedData = Object.keys(data).reduce((acc, key) => {
        const value = data[key as keyof PreferencesFormData];
        if (value === "no-preference") {
          // Keep "no-preference" for furnishing and secondary_location, convert to null for other fields
          (acc as Record<string, unknown>)[key] =
            key === "furnishing" ||
            key === "secondary_location" ||
            key === "commute_location" ||
            key === "smoker"
              ? "no-preference"
              : null;
        } else if (value === "") {
          (acc as Record<string, unknown>)[key] = null;
        } else if (Array.isArray(value) && value.length === 0) {
          // Keep empty arrays as they are (user explicitly cleared selection)
          (acc as Record<string, unknown>)[key] = [];
        } else {
          (acc as Record<string, unknown>)[key] = value;
        }
        return acc;
      }, {} as PreferencesFormData);

      // For updates, only send changed data
      let dataToSend = processedData;
      if (state.existingPreferences) {
        const changedData: Partial<PreferencesFormData> = {};

        Object.keys(processedData).forEach((key) => {
          const currentValue = processedData[key as keyof PreferencesFormData];
          const existingValue = (
            state.existingPreferences as Record<string, unknown>
          )?.[key];

          // Compare values, handling arrays and dates specially
          const hasChanged =
            Array.isArray(currentValue) && Array.isArray(existingValue)
              ? JSON.stringify(currentValue.sort()) !==
                JSON.stringify(existingValue.sort())
              : currentValue !== existingValue;

          if (hasChanged) {
            (changedData as Record<string, unknown>)[key] = currentValue;
          }
        });

        // Special handling for date fields: if any date changed, include both dates
        if (changedData.move_in_date || changedData.move_out_date) {
          changedData.move_in_date = processedData.move_in_date;
          changedData.move_out_date = processedData.move_out_date;
        }

        console.log("🔄 Changed data to send:", changedData);
        dataToSend = changedData as PreferencesFormData;
      }

      // Use update if preferences exist, create if not
      const response = state.existingPreferences
        ? await preferencesAPI.update(dataToSend)
        : await preferencesAPI.create(processedData);

      if (response.status >= 200 && response.status < 300) {
        // Block navigation for 3 seconds after successful save
        blockNavigation(3000);

        setState((prev) => ({
          ...prev,
          existingPreferences: response.data,
        }));

        // Show success toast
        toast.success("Preferences saved successfully!");

        // Clear saved step from localStorage on successful save
        if (typeof window !== "undefined") {
          localStorage.removeItem("preferencesStep");
        }

        // Reset success state after a short delay to avoid UI issues
        setTimeout(() => {
          setState((prev) => ({ ...prev, success: false }));
        }, 100);

        // Don't redirect, just return the response
        return response;
      } else {
        handleSubmitError(response.data);
      }
    } catch (error: unknown) {
      const errorData =
        (error as { response?: { data?: unknown }; [key: string]: unknown })
          ?.response?.data || error;

      handleSubmitError(errorData);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSubmitError = (errorData: unknown) => {
    const errorObj = errorData as Record<string, unknown>;
    if (errorObj?.errors) {
      const fieldErrors: FormFieldErrors = {};
      const errors = errorObj.errors as Record<string, unknown>;
      Object.keys(errors).forEach((field) => {
        const errorValue = errors[field];
        fieldErrors[field] = Array.isArray(errorValue)
          ? (errorValue[0] as string)
          : (errorValue as string);
      });
      setState((prev) => ({ ...prev, backendErrors: fieldErrors }));
    } else {
      const errorMessage =
        (errorObj?.message as string) ||
        "Failed to save preferences. Please try again.";
      setState((prev) => ({
        ...prev,
        generalError: errorMessage,
      }));
      toast.error(errorMessage);
    }
  };

  // Save preferences (can be called at any step)
  const savePreferences = async () => {
    const currentData = getValues();
    try {
      const result = await onSubmit(currentData);
      return result;
    } catch (error) {
      console.error("❌ Failed to save preferences:", error);
      throw error;
    }
  };

  return {
    // State
    ...state,
    watchedData,

    // Form
    register,
    handleSubmit,
    watch,
    setValue,
    errors,
    getValues,

    // Actions
    updateField,
    toggleFeature,
    nextStep,
    prevStep,
    resetToFirstStep,
    onSubmit,
    savePreferences,

    // Computed
    isLastStep: state.step === TOTAL_STEPS,
    isFirstStep: state.step === 1,

    // User info
    user,
    isAuthenticated,
  };
};
