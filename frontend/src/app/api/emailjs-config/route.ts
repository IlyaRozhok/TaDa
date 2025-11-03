import { NextResponse } from "next/server";

export async function GET() {
  // Прямые значения из Vercel Environment Variables
  const config = {
    serviceId: "service_6pn9c83",
    templateId: "template_bgp9fyr",
    publicKey: "n0_0RE2RxeO-ugY3W",
  };

  console.log("EmailJS Config API - returning hardcoded values");

  return NextResponse.json({
    success: true,
    config,
  });
}
