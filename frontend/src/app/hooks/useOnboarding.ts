import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/slices/authSlice";
import { authAPI } from "../lib/api";
import { redirectAfterLogin } from "../utils/simpleRedirect";

interface OnboardingState {
  currentStep: number;
  selectedRole: "tenant" | "operator" | null;
  isLoading: boolean;
  error: string;
  registeredUser: any;
  registeredToken: string | null;
}

interface UseOnboardingReturn {
  state: OnboardingState;
  setCurrentStep: (step: number) => void;
  setSelectedRole: (role: "tenant" | "operator" | null) => void;
  handleRoleSelection: (role: "tenant" | "operator") => Promise<void>;
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
    selectedRole: null,
    isLoading: false,
    error: "",
    registeredUser: null,
    registeredToken: null,
  });

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const setSelectedRole = useCallback((role: "tenant" | "operator" | null) => {
    setState((prev) => ({ ...prev, selectedRole: role }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: "" }));
  }, []);

  const handleRoleSelection = useCallback(
    async (role: "tenant" | "operator") => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: "" }));

        if (isGoogleAuth && user?.registrationId) {
          // Handle Google auth user registration
          const response = await authAPI.createGoogleUser(
            user.registrationId,
            role
          );
          const { user: newUser, accessToken } = response.data;

          setState((prev) => ({
            ...prev,
            registeredUser: newUser,
            registeredToken: accessToken,
            selectedRole: role,
          }));

          // Set auth state
          dispatch(
            setAuth({
              user: newUser,
              accessToken,
              isAuthenticated: true,
            })
          );

          // Move to next step
          setCurrentStep(2);
        } else {
          // Handle regular user role selection
          const response = await authAPI.selectRole(role);
          const { user: updatedUser } = response.data;

          setState((prev) => ({
            ...prev,
            selectedRole: role,
          }));

          // Update user in store
          dispatch(
            setAuth({
              user: updatedUser,
              accessToken: user?.accessToken,
              isAuthenticated: true,
            })
          );

          // Move to next step
          setCurrentStep(2);
        }
      } catch (error: any) {
        console.error("Error selecting role:", error);
        setState((prev) => ({
          ...prev,
          error: error.response?.data?.message || "Failed to select role",
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [isGoogleAuth, user, dispatch, setCurrentStep]
  );

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

        // Redirect based on role
        redirectAfterLogin(state.registeredUser, router);
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

  const handleSkip = useCallback(() => {
    // Skip onboarding and go directly to dashboard
    if (state.registeredUser && state.registeredToken) {
      redirectAfterLogin(state.registeredUser, router);
    } else {
      onComplete();
    }
  }, [state.registeredUser, state.registeredToken, onComplete, router]);

  return {
    state,
    setCurrentStep,
    setSelectedRole,
    handleRoleSelection,
    handleComplete,
    handleSkip,
    clearError,
  };
};
