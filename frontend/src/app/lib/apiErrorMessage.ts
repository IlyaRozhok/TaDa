/**
 * A rejected RTK Query mutation carries `{ status, data }`, axios carries
 * `{ response: { data } }`, and a plain Error carries `message`. The panels
 * mix all three, so the message is pulled out in one place.
 *
 * Extracted from the admin panel page when the operator panel gained the
 * same handlers (package D).
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  // Nest's ValidationPipe rejects with `message: string[]` — one entry per
  // failed rule. Dropping arrays reduced every validation reject (bad
  // vocabulary value, malformed duration list…) to "Unknown error".
  const asText = (message: unknown): string | undefined => {
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message.every((m) => typeof m === "string")) {
      return message.join("; ");
    }
    return undefined;
  };

  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      data?: { message?: unknown };
      response?: { data?: { message?: unknown } };
      message?: unknown;
    };

    return (
      asText(candidate.data?.message) ??
      asText(candidate.response?.data?.message) ??
      asText(candidate.message) ??
      fallback
    );
  }

  return fallback;
}
