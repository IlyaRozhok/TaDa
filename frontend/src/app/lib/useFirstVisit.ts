import { useState, useEffect } from "react";

export function useFirstVisit(userId?: string) {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Check if this is the user's first visit
    const welcomeShownKey = `welcome_shown_${userId}`;
    const hasShown = localStorage.getItem(welcomeShownKey);

    if (!hasShown) {
      setIsFirstVisit(true);
    }
  }, [userId]);

  const markWelcomeAsShown = () => {
    if (!userId) return;

    const welcomeShownKey = `welcome_shown_${userId}`;
    localStorage.setItem(welcomeShownKey, "true");
    setHasShownWelcome(true);
    setIsFirstVisit(false);
  };

  return {
    isFirstVisit,
    hasShownWelcome,
    markWelcomeAsShown,
  };
}
