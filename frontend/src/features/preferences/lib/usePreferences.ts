"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/store/hooks";
import { preferencesAPI } from "@/app/lib/api";
import {
  FormFieldErrors,
  PreferencesFormData,
  PreferencesState,
  transformApiDataForForm,
  transformFormDataForApi,
} from "@/entities/preferences/model/preferences";
import { TOTAL_STEPS_NEW as TOTAL_STEPS } from "@/entities/preferences/model/constants";
import { waitForSessionManager } from "@/app/components/providers/SessionManager";
import { blockNavigation } from "@/app/utils/navigationGuard";

export default function usePreferences(currentStepOffset: number = 0) {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();
  const scrollPositionRef = useRef<number>(0);
  const hasCheckedAuthRef = useRef<boolean>(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingFieldRef = useRef<{
    field: keyof PreferencesFormData;
    value: unknown;
  } | null>(null);

  const [state, setState] = useState<PreferencesState>(() => {
    let initialStep = 1;

    // For onboarding (when there's an offset), always start from step 1
    if (currentStepOffset > 0) {
      // For onboarding, check localStorage for saved step
      const savedStep =
        typeof window !== "undefined"
          ? localStorage.getItem("preferencesStep")
          : null;
      if (savedStep) {
        const parsedStep = parseInt(savedStep, 10);
        // Convert from display step (with offset) to internal step
        const internalStep = parsedStep - currentStepOffset;
        if (internalStep >= 1 && internalStep <= TOTAL_STEPS) {
          initialStep = internalStep;
        }
      }
    } else {
      // For standalone preferences, always start from step 1 (don't read from localStorage)
      initialStep = 1;
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
      // Step 1 - Lifestyle Preferences
      occupation: "",
      family_status: "",
      children_count: "",
      // Step 2 - Location
      preferred_areas: [],
      preferred_districts: [],
      preferred_metro_stations: [],
      // Step 3 - Budget & Move-in
      move_in_date: "",
      move_out_date: "",
      min_price: undefined,
      max_price: undefined,
      move_in_flexibility: "",
      // Step 4 - Property & Rooms
      property_types: [],
      property_type_preferences: [], // UI alias
      bedrooms: [],
      rooms_preferences: [], // UI alias
      bathrooms: [],
      bathrooms_preferences: [], // UI alias
      furnishing: [],
      furnishing_preferences: [], // UI alias
      outdoor_space: false,
      balcony: false,
      terrace: false,
      outdoor_space_preferences: [], // UI alias
      min_square_meters: undefined,
      max_square_meters: undefined,
      // Step 5 - Building & Duration
      building_types: [],
      building_style_preferences: [], // UI alias
      let_duration: "",
      selected_duration: "", // UI alias
      bills: "",
      selected_bills: "", // UI alias
      // Step 6 - Tenant Type
      tenant_types: [],
      tenant_type_preferences: [], // UI alias
      // Step 7 - Pets
      pet_policy: false,
      pets: [],
      pet_type_preferences: [], // UI alias
      number_of_pets: undefined,
      pet_additional_info: "", // UI field for pet additional info
      // Step 8 - Amenities
      amenities: [],
      amenities_preferences: [], // UI alias
      is_concierge: false,
      smoking_area: false,
      additional_preferences: [], // UI alias
      // Step 9 - Hobbies
      hobbies: [],
      // Step 10 - Living Environment
      ideal_living_environment: [],
      smoker: "",
      // Step 11 - About You
      preferred_address: "",
      additional_info: "",
      // Legacy fields (for backward compatibility - only keeping used ones)
      commute_time_walk: undefined,
      commute_time_cycle: undefined,
      commute_time_tube: undefined,
      min_bedrooms: undefined,
      max_bedrooms: undefined,
      min_bathrooms: undefined,
      max_bathrooms: undefined,
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

  // Save current step to localStorage (only for onboarding, not for standalone preferences)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Only save step if we're in onboarding context (currentStepOffset > 0)
      // For standalone preferences (currentStepOffset = 0), don't save step
      if (currentStepOffset > 0) {
        const stepToSave = state.step + currentStepOffset;
        localStorage.setItem("preferencesStep", stepToSave.toString());
      } else {
        // Clear step for standalone preferences
        localStorage.removeItem("preferencesStep");
      }
    }
  }, [state.step, currentStepOffset]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

        // Transform API data to form format
        const formData = transformApiDataForForm(response.data);

        // Populate form with transformed data
        Object.keys(formData).forEach((key) => {
          const value = formData[key as keyof PreferencesFormData];

          // Skip special fields (but allow empty arrays, false booleans, etc.)
          if (
            key === "id" ||
            key === "user_id" ||
            key === "user" ||
            key === "created_at" ||
            key === "updated_at"
          ) {
            return;
          }

          // Skip only null/undefined (but not empty arrays or false booleans)
          if (value === null || value === undefined) {
            return;
          }

          // Handle date fields
          if ((key === "move_in_date" || key === "move_out_date") && value) {
            const dateValue =
              typeof value === "string" && value.includes("T")
                ? value.split("T")[0]
                : value;
            setValue(key as keyof PreferencesFormData, dateValue);
            return;
          }

          // Handle boolean fields (including false)
          if (typeof value === "boolean") {
            setValue(key as keyof PreferencesFormData, value);
            return;
          }

          // Handle all other fields (including empty arrays)
          setValue(key as keyof PreferencesFormData, value);
        });
      }
    } catch {
      // Check if this is a 404 (no preferences yet) or another error
      setState((prev) => ({ ...prev, existingPreferences: null }));
    }
  };

  // Save single field to API - defined before updateField and toggleFeature
  const saveSingleField = useCallback(
    async (field: keyof PreferencesFormData, value: unknown) => {
      try {
        // For pet-related fields, we need to include both pet_type_preferences and pet_additional_info
        // so the transformation can properly construct the pets array with customType
        const formData: Partial<PreferencesFormData> = {
          [field]: value,
        } as Partial<PreferencesFormData>;
        
        // Include related fields needed for transformation
        if (field === "pet_additional_info") {
          const currentPetTypes = getValues("pet_type_preferences");
          if (currentPetTypes) {
            formData.pet_type_preferences = currentPetTypes;
          }
        } else if (field === "pet_type_preferences") {
          const currentPetAdditionalInfo = getValues("pet_additional_info");
          if (currentPetAdditionalInfo !== undefined) {
            formData.pet_additional_info = currentPetAdditionalInfo;
          }
        }
        
        const transformedData = transformFormDataForApi(formData);

        // Process all transformed keys (handle empty arrays, nulls, etc.)
        const updateData = Object.keys(transformedData).reduce((acc, key) => {
          const fieldKey = key as keyof PreferencesFormData;
          const transformedValue = transformedData[fieldKey];

          let processedValue = transformedValue;
          if (transformedValue === "") {
            processedValue = null;
          } else if (
            Array.isArray(transformedValue) &&
            transformedValue.length === 0
          ) {
            processedValue = [];
          }

          (acc as Record<string, unknown>)[fieldKey] = processedValue;
          return acc;
        }, {} as Partial<PreferencesFormData>);

        // If no preferences exist, create new with this field
        if (!state.existingPreferences) {
          const response = await preferencesAPI.create(updateData);
          setState((prev) => ({
            ...prev,
            existingPreferences: response.data,
          }));
          return;
        }

        // Check if any value actually changed
        const existingPreferences =
          (state.existingPreferences as Record<string, unknown>) || {};
        const hasChanged = Object.entries(updateData).some(
          ([key, processedValue]) => {
            const existingValue = existingPreferences[key];
            if (Array.isArray(processedValue)) {
              const existingArray = Array.isArray(existingValue)
                ? existingValue
                : [];
              return (
                JSON.stringify([...processedValue].sort()) !==
                JSON.stringify([...existingArray].sort())
              );
            }
            return processedValue !== existingValue;
          }
        );

        if (!hasChanged) {
          return; // No change, skip save
        }

        // Update preferences
        await preferencesAPI.update(updateData);

        // Update existingPreferences in state
        setState((prev) => ({
          ...prev,
          existingPreferences: {
            ...(prev.existingPreferences as Record<string, unknown>),
            ...updateData,
          },
        }));
      } catch (error) {
        console.error(`Failed to save field ${field as string}:`, error);
        // Silent fail - don't show toast
      }
    },
    [state.existingPreferences]
  );

  const updateField = useCallback(
    (
      field: keyof PreferencesFormData,
      value: string | number | boolean | string[] | undefined
    ) => {
      setValue(field, value, { shouldValidate: false, shouldDirty: true });

      // Auto-save the field after debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      pendingFieldRef.current = { field, value };

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingFieldRef.current) {
          saveSingleField(
            pendingFieldRef.current.field,
            pendingFieldRef.current.value
          );
          pendingFieldRef.current = null;
        }
      }, 500); // 500ms debounce
    },
    [setValue, saveSingleField]
  );

  const toggleFeature = useCallback(
    (category: keyof PreferencesFormData, feature: string) => {
      scrollPositionRef.current = window.scrollY;

      const current = (watchedData[category] as string[]) || [];
      const updated = current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature];

      setValue(category, updated, { shouldValidate: false, shouldDirty: true });

      // Auto-save the field after debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      pendingFieldRef.current = { field: category, value: updated };

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingFieldRef.current) {
          saveSingleField(
            pendingFieldRef.current.field,
            pendingFieldRef.current.value
          );
          pendingFieldRef.current = null;
        }
      }, 500); // 500ms debounce

      // Restore scroll position
      const restoreScroll = () => {
        window.scrollTo(0, scrollPositionRef.current);
      };

      restoreScroll();
      requestAnimationFrame(restoreScroll);
      setTimeout(restoreScroll, 0);
    },
    [watchedData, setValue, saveSingleField]
  );

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
      // Transform form data to API format
      const transformedData = transformFormDataForApi(data);

      // Handle empty values and arrays
      const processedData = Object.keys(transformedData).reduce((acc, key) => {
        const value = transformedData[key as keyof typeof transformedData];
        if (value === "") {
          (acc as Record<string, unknown>)[key] = null;
        } else if (Array.isArray(value) && value.length === 0) {
          // Keep empty arrays as they are (user explicitly cleared selection)
          (acc as Record<string, unknown>)[key] = [];
        } else {
          (acc as Record<string, unknown>)[key] = value;
        }
        return acc;
      }, {} as Partial<PreferencesFormData>);

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
          let hasChanged = false;

          if (Array.isArray(currentValue)) {
            // Handle array comparison
            const existingArray = Array.isArray(existingValue)
              ? existingValue
              : [];
            hasChanged =
              JSON.stringify([...currentValue].sort()) !==
              JSON.stringify([...existingArray].sort());
          } else {
            hasChanged = currentValue !== existingValue;
          }

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
        dataToSend = changedData;
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
      // Silent error - no toast
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

  // Define nextStep - no longer saves, just moves to next step
  const nextStep = useCallback(() => {
    if (state.step < TOTAL_STEPS) {
      // Flush any pending saves before moving to next step
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (pendingFieldRef.current) {
        saveSingleField(
          pendingFieldRef.current.field,
          pendingFieldRef.current.value
        );
        pendingFieldRef.current = null;
      }

      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  }, [state.step, saveSingleField]);

  // Define prevStep - just moves to previous step
  const previousStep = useCallback(() => {
    if (state.step > 1) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  }, [state.step]);

  const isLastStep = state.step === TOTAL_STEPS;
  const isFirstStep = state.step === 1;

  const debouncedHandleSubmit = handleSubmit(onSubmit);

  return {
    ...state,
    register,
    handleSubmit: debouncedHandleSubmit,
    errors,
    watchedData,
    updateField,
    toggleFeature,
    nextStep,
    prevStep: previousStep,
    resetToFirstStep,
    savePreferences,
    isLastStep,
    isFirstStep,
    user,
    isAuthenticated,
  };
}
