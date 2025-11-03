"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/slices/authSlice";
import { authAPI } from "../lib/api";
import { useAuthContext } from "./AuthContext";

// Types
interface OnboardingUserData {
  email: string;
  password: string;
  provider: string;
}

interface OnboardingContextType {
  // State
  selectedRole: "tenant" | "operator" | null;
  userData: OnboardingUserData;
  isLoading: boolean;
  error: string;

  // Actions
  setSelectedRole: (role: "tenant" | "operator" | null) => void;
  setUserData: (data: Partial<OnboardingUserData>) => void;
  setError: (error: string) => void;
  setIsLoading: (loading: boolean) => void;

  // Handlers
  handleRoleSelect: (role: "tenant" | "operator") => void;
  handleComplete: () => Promise<void>;
  handleCompleteWithPreferences: () => Promise<void>;
  handleBack: (currentStep: number) => void;
  handleNext: (currentStep: number) => void;
  handleContinue: () => void;

  // Utilities
  clearOnboardingData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [selectedRole, setSelectedRole] = useState<
    "tenant" | "operator" | null
  >(null);
  const [userData, setUserData] = useState<OnboardingUserData>({
    email: "",
    password: "",
    provider: "local",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const dispatch = useDispatch();
  const authContext = useAuthContext();

  // Restore selected role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("selectedRole") as
      | "tenant"
      | "operator"
      | null;
    if (savedRole) {
      setSelectedRole(savedRole);
    }
  }, []);

  // Restore user data from AuthContext on mount and when credentials change
  useEffect(() => {
    if (authContext.credentials) {
      setUserData({
        email: authContext.credentials.email,
        password: authContext.credentials.password,
        provider: "local",
      });
    }
  }, [authContext.credentials]);

  // Additional effect to ensure data is always available when needed
  useEffect(() => {
    // If we don't have userData but AuthContext has credentials, restore them
    if (!userData.email && !userData.password && authContext.credentials) {
      setUserData({
        email: authContext.credentials.email,
        password: authContext.credentials.password,
        provider: "local",
      });
    }
  }, [userData.email, userData.password, authContext.credentials]);

  // Fallback: check localStorage directly if AuthContext doesn't have data
  useEffect(() => {
    if (!userData.email && !userData.password && !authContext.credentials) {
      const savedCredentials = localStorage.getItem("authCredentials");
      if (savedCredentials) {
        try {
          const parsed = JSON.parse(savedCredentials);

          setUserData({
            email: parsed.email,
            password: parsed.password,
            provider: "local",
          });
        } catch (e) {
          console.error(
            "Error parsing saved credentials in OnboardingContext:",
            e
          );
        }
      }
    }
  }, [userData.email, userData.password, authContext.credentials]);

  const handleRoleSelect = (role: "tenant" | "operator") => {
    setSelectedRole(role);
    localStorage.setItem("selectedRole", role);
    setError("");
  };

  const handleComplete = async () => {
    const role = selectedRole || "tenant";
    console.log("🔍 handleComplete - START:", {
      userData: {
        email: userData.email,
        password: userData.password ? "***" : "empty",
      },
      authContext: {
        hasCredentials: !!authContext.credentials,
        email: authContext.credentials?.email,
        password: authContext.credentials?.password ? "***" : "empty",
      },
      timestamp: new Date().toISOString(),
    });

    // Check if we have userData, if not try to get from AuthContext
    let email = userData.email;
    let password = userData.password;

    if (!email || !password) {
      if (authContext.credentials) {
        console.log("🔍 Using credentials from AuthContext");
        email = authContext.credentials.email;
        password = authContext.credentials.password;
      } else {
        // Fallback: try to get from localStorage
        const savedCredentials = localStorage.getItem("authCredentials");
        if (savedCredentials) {
          try {
            const parsed = JSON.parse(savedCredentials);
            console.log("🔍 Fallback: Using credentials from localStorage");
            email = parsed.email;
            password = parsed.password;
          } catch (e) {
            console.error("Error parsing saved credentials:", e);
            setError("Please complete the registration form first");
            return;
          }
        } else {
          setError("Please complete the registration form first");
          return;
        }
      }
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        email,
        password,
        role,
      };

      console.log("🔍 handleComplete - FINAL PAYLOAD:", {
        email: payload.email,
        password: payload.password ? "***" : "empty",
        role: payload.role,
        timestamp: new Date().toISOString(),
      });
      const response = await authAPI.register(payload);

      dispatch(
        setAuth({
          user: response.data.user,
          accessToken: response.data.access_token,
        })
      );

      localStorage.setItem("accessToken", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      console.log("🔍 Token saved to localStorage:", {
        token: response.data.access_token ? "Present" : "Missing",
        user: response.data.user ? "Present" : "Missing",
      });

      // Clear onboarding data
      clearOnboardingData();

      // Clear AuthContext credentials after successful registration
      authContext.clearCredentials();

      // Small delay to ensure localStorage is updated before redirect
      setTimeout(() => {
        console.log("🔍 Redirecting to dashboard with token:", {
          token: localStorage.getItem("accessToken") ? "Present" : "Missing",
        });
        router.push(
          role === "tenant"
            ? "/app/dashboard/tenant"
            : "/app/dashboard/operator"
        );
      }, 100);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err?.response?.data?.message || "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteWithPreferences = async () => {
    const role = selectedRole || "tenant";
    console.log("handleCompleteWithPreferences - userData:", {
      email: userData.email,
      hasPassword: !!userData.password,
    });
    console.log("handleCompleteWithPreferences - authContext.credentials:", {
      hasCredentials: !!authContext.credentials,
      email: authContext.credentials?.email,
      hasPassword: !!authContext.credentials?.password,
    });

    // Check if we have userData, if not try to get from AuthContext
    let email = userData.email;
    let password = userData.password;

    if (!email || !password) {
      if (authContext.credentials) {
        console.log("🔍 Using credentials from AuthContext for preferences");
        email = authContext.credentials.email;
        password = authContext.credentials.password;
      } else {
        // Fallback: try to get from localStorage
        const savedCredentials = localStorage.getItem("authCredentials");
        if (savedCredentials) {
          try {
            const parsed = JSON.parse(savedCredentials);
            console.log(
              "🔍 Fallback: Using credentials from localStorage for preferences"
            );
            email = parsed.email;
            password = parsed.password;
          } catch (e) {
            console.error("Error parsing saved credentials:", e);
            setError("Please complete the registration form first");
            return;
          }
        } else {
          setError("Please complete the registration form first");
          return;
        }
      }
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        email,
        password,
        role,
      };

      console.log("Registering with preferences payload:", payload);
      const response = await authAPI.register(payload);

      dispatch(
        setAuth({
          user: response.data.user,
          accessToken: response.data.access_token,
        })
      );

      localStorage.setItem("accessToken", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      console.log("🔍 Token saved to localStorage (preferences):", {
        token: response.data.access_token ? "Present" : "Missing",
        user: response.data.user ? "Present" : "Missing",
      });

      // Clear onboarding data
      clearOnboardingData();

      // Clear AuthContext credentials after successful registration
      authContext.clearCredentials();

      // Small delay to ensure localStorage is updated before redirect
      setTimeout(() => {
        console.log("🔍 Redirecting to preferences with token:", {
          token: localStorage.getItem("accessToken") ? "Present" : "Missing",
        });
        router.push(
          role === "tenant" ? "/app/preferences" : "/app/dashboard/operator"
        );
      }, 100);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err?.response?.data?.message || "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = (currentStep: number) => {
    setError("");
    if (currentStep > 1) {
      router.push(`/onboarding/${currentStep - 1}`);
    } else {
      router.push("/");
    }
  };

  const handleNext = (currentStep: number) => {
    setError("");
    router.push(`/onboarding/${currentStep + 1}`);
  };

  const handleContinue = () => {
    if (!selectedRole) {
      setError("Please select a role to continue");
      return;
    }
    router.push("/onboarding/2");
  };

  const clearOnboardingData = () => {
    localStorage.removeItem("selectedRole");
    setSelectedRole(null);
    setUserData({
      email: "",
      password: "",
      provider: "local",
    });
    setError("");
    // Don't clear AuthContext credentials here - they should persist until registration is complete
  };

  const contextValue: OnboardingContextType = {
    // State
    selectedRole,
    userData,
    isLoading,
    error,

    // Actions
    setSelectedRole,
    setUserData,
    setError,
    setIsLoading,

    // Handlers
    handleRoleSelect,
    handleComplete,
    handleCompleteWithPreferences,
    handleBack,
    handleNext,
    handleContinue,

    // Utilities
    clearOnboardingData,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error(
      "useOnboardingContext must be used within an OnboardingProvider"
    );
  }
  return context;
}
