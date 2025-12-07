import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/slices/authSlice";
import { authAPI } from "../lib/api";
import { redirectAfterLogin } from "../utils/simpleRedirect";

interface OnboardingState {
  currentStep: number;
  isLoading: boolean;
  error: string;
  registeredUser: any;
  registeredToken: string | null;
}

interface UseOnboardingReturn {
  state: OnboardingState;
  setCurrentStep: (step: number) => void;
  handleComplete: () => Promise<void>;
  handleSkip: () => void;
  clearError: () => void;
}

export const useOnboarding = (
  user: any,
  onComplete: () => void,
  isGoogleAuth: boolean = false
): UseOnboardingReturn => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    isLoading: false,
    error: "",
    registeredUser: null,
    registeredToken: null,
  });

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: "" }));
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: "" }));

      // If we have a registered user from Google auth, complete the flow
      if (state.registeredUser && state.registeredToken) {
        // Store the token
        localStorage.setItem("accessToken", state.registeredToken);
        localStorage.setItem(
          "sessionExpiry",
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        );

        // Redirect to tenant dashboard
        await redirectAfterLogin(state.registeredUser, router);
      } else {
        // Regular flow completion
        onComplete();
      }
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      setState((prev) => ({
        ...prev,
        error: error.response?.data?.message || "Failed to complete onboarding",
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.registeredUser, state.registeredToken, onComplete, router]);

  const handleSkip = useCallback(async () => {
    // Skip onboarding and go directly to dashboard
    if (state.registeredUser && state.registeredToken) {
      await redirectAfterLogin(state.registeredUser, router);
    } else {
      onComplete();
    }
  }, [state.registeredUser, state.registeredToken, onComplete, router]);

  return {
    state,
    setCurrentStep,
    handleComplete,
    handleSkip,
    clearError,
  };
};
