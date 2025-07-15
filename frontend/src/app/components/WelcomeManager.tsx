"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";
import { useFirstVisit } from "../lib/useFirstVisit";
import WelcomeModal from "./WelcomeModal";

export default function WelcomeManager() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [showWelcome, setShowWelcome] = useState(false);

  const { isFirstVisit, markWelcomeAsShown } = useFirstVisit(user?.id);

  useEffect(() => {
    // Show welcome modal for first-time authenticated users
    if (isAuthenticated && user && isFirstVisit) {
      // Small delay to ensure the user is fully redirected to dashboard
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isFirstVisit]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    markWelcomeAsShown();
  };

  return (
    <WelcomeModal
      isOpen={showWelcome}
      onClose={handleCloseWelcome}
      userName={user?.full_name}
    />
  );
}
