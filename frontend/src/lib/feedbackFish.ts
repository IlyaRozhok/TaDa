/**
 * Feedback Fish (feedback.fish) widget configuration.
 *
 * Env-gated the same way GA4 and PostHog are: with no project id nothing is
 * loaded and no trigger is rendered, so local development, previews and any
 * scope where the owner has not set the id stay silent — and no dead button
 * ships to users.
 *
 * The widget itself needs no npm package. `ff.js` re-scans the document about
 * once a second and binds a click handler to every `[data-feedback-fish]`
 * element it finds, so triggers that mount later (inside a menu, say) are
 * picked up too. No user data is passed: the trigger carries the bare
 * attribute, never `data-feedback-fish-userid`, so feedback stays anonymous.
 */

/**
 * `next/script` dedupes by id, so the loader can be rendered by more than one
 * Header instance without injecting the script twice.
 */
export const FEEDBACK_FISH_SCRIPT_ID = "feedback-fish";

/** The configured project id, or `null` when the widget is switched off. */
export function getFeedbackFishProjectId(): string | null {
  // Read as a full member expression — Next.js inlines it at build time.
  const projectId = process.env.NEXT_PUBLIC_FEEDBACK_FISH_PROJECT_ID?.trim();
  return projectId ? projectId : null;
}

/** Loader URL for a given project id. */
export function getFeedbackFishScriptSrc(projectId: string): string {
  return `https://feedback.fish/ff.js?projectId=${encodeURIComponent(projectId)}`;
}
