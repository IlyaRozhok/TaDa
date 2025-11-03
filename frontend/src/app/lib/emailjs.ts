// EmailJS client-side integration
interface EmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source?: string; // "Operator" or "Tenant"
}

export async function sendDemoRequest(
  data: EmailData
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      return {
        success: false,
        message: "All fields are required",
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        message: "Invalid email format",
      };
    }

    // Check if we're in browser environment
    if (typeof window === "undefined") {
      return {
        success: false,
        message: "EmailJS can only run in browser environment",
      };
    }

    // Wait for EmailJS to load if not available yet
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    while (!window.emailjs && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    // Check if EmailJS is loaded
    if (!window.emailjs) {
      return {
        success: false,
        message:
          "EmailJS failed to load. Please check your internet connection.",
      };
    }

    // Get configuration from global object
    if (!window.EMAILJS_CONFIG) {
      console.error("❌ EmailJS configuration not found in global object");
      return {
        success: false,
        message: "EmailJS configuration is missing. Please contact support.",
      };
    }

    const { serviceId, templateId, publicKey } = window.EMAILJS_CONFIG;

    console.log("📧 Using EmailJS config:", {
      serviceId: `${serviceId.substring(0, 8)}...`,
      templateId: `${templateId.substring(0, 8)}...`,
      publicKey: `${publicKey.substring(0, 8)}...`,
    });

    // Prepare current timestamp
    const submittedAt = new Date().toLocaleString("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Prepare template parameters
    const templateParams = {
      from_name: `${data.firstName} ${data.lastName}`,
      from_email: data.email,
      phone: data.phone,
      submitted_at: submittedAt,
      source: data.source || "Website", // Add source field
    };

    console.log("📤 Sending email with EmailJS...");

    // Send email using EmailJS
    const response = await window.emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    console.log("✅ Email sent successfully!", response);

    return {
      success: true,
      message: "Request sent successfully!",
    };
  } catch (error: unknown) {
    const emailError = error as {
      message?: string;
      text?: string;
      status?: number;
      name?: string;
      stack?: string;
    };

    console.error("EmailJS Error Details:", {
      error,
      message: emailError?.message,
      text: emailError?.text,
      status: emailError?.status,
      name: emailError?.name,
      stack: emailError?.stack,
    });

    // More specific error messages
    let errorMessage = "Failed to send demo request";

    if (emailError?.status === 400) {
      errorMessage = "Invalid email configuration. Please contact support.";
    } else if (emailError?.status === 401) {
      errorMessage =
        "Email service authentication failed. Please contact support.";
    } else if (emailError?.status === 403) {
      errorMessage = "Email service access denied. Please contact support.";
    } else if (emailError?.status === 404) {
      errorMessage = "Email template not found. Please contact support.";
    } else if (emailError?.text) {
      errorMessage = emailError.text;
    } else if (emailError?.message) {
      errorMessage = emailError.message;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

// Type declaration for EmailJS and config moved to EmailJSInitializer.tsx
