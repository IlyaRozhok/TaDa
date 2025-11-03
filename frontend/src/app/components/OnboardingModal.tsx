"use client";

import { useEffect } from "react";
import { useOnboardingContext } from "../contexts/OnboardingContext";
import AuthModal from "./AuthModal";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
}: OnboardingModalProps) {
  const onboardingContext = useOnboardingContext();

  // Sync AuthModal data with OnboardingContext when modal closes
  const handleClose = () => {
    onClose();
  };

  // Sync AuthModal data with OnboardingContext when modal opens
  useEffect(() => {
    if (isOpen) {
      // If we have user data in context, we can use it
      console.log("OnboardingModal opened with context data:", {
        email: onboardingContext.userData.email,
        password: onboardingContext.userData.password ? "***" : "empty",
        role: onboardingContext.selectedRole,
      });
    }
  }, [isOpen, onboardingContext.userData, onboardingContext.selectedRole]);

  return <AuthModal isOpen={isOpen} onClose={handleClose} />;
}
