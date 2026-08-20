import { NextResponse } from "next/server";

// Serves the EmailJS configuration to the client (see EmailJSInitializer).
// The values are read from server-side environment variables (Vercel project
// settings / .env.local) so they never live in the repository or the bundle.
export async function GET() {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return NextResponse.json(
      { success: false, error: "EmailJS is not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    config: { serviceId, templateId, publicKey },
  });
}
