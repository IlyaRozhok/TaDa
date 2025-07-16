import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/store/hooks";
import { preferencesAPI } from "@/app/lib/api";
import {
  PreferencesFormData,
  FormFieldErrors,
  PreferencesState,
} from "@/app/types/preferences";
import { TOTAL_STEPS } from "@/app/constants/preferences";

export const usePreferences = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();
  const scrollPositionRef = useRef<number>(0);

  const [state, setState] = useState<PreferencesState>({
    loading: false,
    step: 1,
    existingPreferences: null,
    success: false,
    backendErrors: {},
    generalError: "",
  });

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

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/app/auth/login");
      return;
    }

    if (user.roles?.includes("operator")) {
      router.push("/app/dashboard/operator");
      return;
    }

    loadExistingPreferences();
  }, [isAuthenticated, user, router]);

  const loadExistingPreferences = async () => {
    try {
      const response = await preferencesAPI.get();
      setState((prev) => ({ ...prev, existingPreferences: response.data }));

      // Populate form with existing data
      Object.keys(response.data).forEach((key) => {
        if (response.data[key] !== null && response.data[key] !== undefined) {
          setValue(key as keyof PreferencesFormData, response.data[key]);
        }
      });
    } catch (error) {
      console.log("No existing preferences found, using defaults");
      setState((prev) => ({ ...prev, existingPreferences: null }));
    }
  };

  const updateField = useCallback(
    (field: keyof PreferencesFormData, value: any) => {
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

  const onSubmit = async (data: PreferencesFormData) => {
    console.log("🔍 Form submission started", {
      currentStep: state.step,
      totalSteps: TOTAL_STEPS,
      isLastStep: state.step === TOTAL_STEPS,
      formData: data,
    });

    if (state.step !== TOTAL_STEPS) {
      console.log("❌ Form submission prevented - not on final step", {
        currentStep: state.step,
        totalSteps: TOTAL_STEPS,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      backendErrors: {},
      generalError: "",
    }));

    try {
      console.log("📤 Processing form data for submission...");

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

      console.log("📤 Sending data to API:", processedData);

      const response = await preferencesAPI.create(processedData);

      console.log("📥 API response:", response);

      if (response.status >= 200 && response.status < 300) {
        console.log("✅ Preferences saved successfully");
        setState((prev) => ({ ...prev, success: true }));
        setTimeout(() => {
          router.push("/app/dashboard/tenant");
        }, 2000);
      } else {
        console.log("❌ API response error:", response.data);
        handleSubmitError(response.data);
      }
    } catch (error: any) {
      console.error("❌ Form submission error:", error);
      const errorData = error?.response?.data || error;
      console.error("❌ Error data:", errorData);
      handleSubmitError(errorData);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSubmitError = (errorData: any) => {
    if (errorData?.errors) {
      const fieldErrors: FormFieldErrors = {};
      Object.keys(errorData.errors).forEach((field) => {
        fieldErrors[field] = Array.isArray(errorData.errors[field])
          ? errorData.errors[field][0]
          : errorData.errors[field];
      });
      setState((prev) => ({ ...prev, backendErrors: fieldErrors }));
    } else {
      setState((prev) => ({
        ...prev,
        generalError:
          errorData?.message || "Failed to save preferences. Please try again.",
      }));
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

    // Actions
    updateField,
    toggleFeature,
    nextStep,
    prevStep,
    onSubmit,

    // Computed
    isLastStep: state.step === TOTAL_STEPS,
    isFirstStep: state.step === 1,

    // User info
    user,
    isAuthenticated,
  };
};
