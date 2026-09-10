"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import {
  useTranslation,
  translateWithFallback,
} from "@/app/hooks/useTranslation";
import { generalKeys } from "@/app/lib/translationsKeys/generalKeys";
import { getFeedbackFishProjectId } from "@/lib/feedbackFish";

interface FeedbackFishButtonProps {
  /** Classes for the button itself, so each header keeps its own look. */
  className?: string;
  /** Classes for the icon — headers size their icons differently. */
  iconClassName?: string;
  /** Menu rows show the label; compact icon bars do not. */
  showLabel?: boolean;
  /** Close the menu the trigger sits in, if any. */
  onClick?: () => void;
}

/**
 * The Feedback Fish trigger, shared by every header.
 *
 * `ff.js` (loaded once from the root layout) re-scans the document about once a
 * second and binds a click handler to every `[data-feedback-fish]` element, so
 * the attribute is the whole integration — triggers that mount later, inside a
 * menu that opens on click, are picked up too.
 *
 * Renders nothing when `NEXT_PUBLIC_FEEDBACK_FISH_PROJECT_ID` is unset: with no
 * project id the loader is not rendered either, and a button that cannot open
 * anything must not ship. Nothing about the visitor is passed — the bare
 * attribute, never `data-feedback-fish-userid`, so feedback stays anonymous.
 */
export default function FeedbackFishButton({
  className = "",
  iconClassName = "w-5 h-5",
  showLabel = false,
  onClick,
}: FeedbackFishButtonProps) {
  const { t } = useTranslation();

  if (!getFeedbackFishProjectId()) {
    return null;
  }

  const label = translateWithFallback(
    t,
    generalKeys.feedback.button,
    "Feedback",
  );

  return (
    <button
      type="button"
      data-feedback-fish
      onClick={onClick}
      className={className}
      aria-label={label}
      title={label}
    >
      <MessageSquare className={iconClassName} aria-hidden="true" />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
