// Demo-request submission. Replaces the EmailJS browser integration: the
// form posts to the backend, which validates, dedupes (one per email per day)
// and delivers through the same durable SES outbox as every other
// notification. Plain fetch on purpose — the form lives on the public
// landing, so no auth client is involved.

interface DemoRequestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source?: string; // "Operator" | "Tenant" | "Website"
}

export async function sendDemoRequest(
  data: DemoRequestData,
): Promise<{ success: boolean; message: string }> {
  if (!data.firstName || !data.lastName || !data.email || !data.phone) {
    return { success: false, message: "All fields are required" };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return { success: false, message: "API is not configured" };
  }

  try {
    const res = await fetch(`${apiUrl}/demo-requests`, {
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
        message: message || "Failed to send demo request",
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
