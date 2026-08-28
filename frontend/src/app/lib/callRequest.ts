// "Book a call" submission from the two public landings. The form posts to the
// backend, which stores the request in `call_requests` and delivers a support
// notification through the same durable SES outbox as every other notification.
// Plain fetch on purpose — the form lives on the public landing, so no auth
// client is involved.

// The wire shape is hand-written rather than pulled from
// `@/types/generated/api` because the generated types are refreshed by a
// backend openapi dump that is not part of this change. Once CI (or the owner)
// re-runs `npm run gen:api`, this can become
// `components["schemas"]["CreateCallRequestDto"]` and a DTO change on the
// backend will break the file at compile time instead of at runtime.
export type CallRequestSource = "tenant" | "operator";

export interface CallRequestPayload {
  /** Stable slug from the audience's reason list — never the localized label. */
  reason: string;
  name: string;
  email: string;
  phone: {
    /** ISO 3166-1 alpha-2, e.g. "GB". */
    countryCode: string;
    number: string;
  };
  /** Slugs: "morning" | "afternoon" | "evening" | "asap". Omitted when empty. */
  preferredTimes?: string[];
  notes?: string;
  source: CallRequestSource;
}

export async function sendCallRequest(
  data: CallRequestPayload,
): Promise<{ success: boolean; message: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return { success: false, message: "API is not configured" };
  }

  try {
    const res = await fetch(`${apiUrl}/call-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.status === 429) {
      return {
        success: false,
        message: "Too many requests — please try again in a minute.",
      };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message = Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message;
      return {
        success: false,
        message: message || "Failed to send your request",
      };
    }

    return { success: true, message: "Request sent successfully!" };
  } catch {
    return {
      success: false,
      message: "Network error — please check your connection and try again.",
    };
  }
}
