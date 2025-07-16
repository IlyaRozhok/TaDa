#!/usr/bin/env ts-node

import { config } from "dotenv";
import { join } from "path";

// Load environment variables
config({ path: join(__dirname, "..", ".env") });

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  frontendUrl: string;
}

function validateGoogleOAuthConfig(): GoogleOAuthConfig {
  const config = {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || "",
    frontendUrl: process.env.FRONTEND_URL || "",
  };

  const errors: string[] = [];

  // Check required environment variables
  if (!config.clientId) {
    errors.push("❌ GOOGLE_CLIENT_ID is not set");
  } else if (!config.clientId.includes(".apps.googleusercontent.com")) {
    errors.push(
      "❌ GOOGLE_CLIENT_ID should end with .apps.googleusercontent.com"
    );
  }

  if (!config.clientSecret) {
    errors.push("❌ GOOGLE_CLIENT_SECRET is not set");
  } else if (config.clientSecret.length < 10) {
    errors.push("❌ GOOGLE_CLIENT_SECRET seems too short");
  }

  if (!config.callbackUrl) {
    errors.push("❌ GOOGLE_CALLBACK_URL is not set");
  } else if (!config.callbackUrl.includes("/auth/google/callback")) {
    errors.push("❌ GOOGLE_CALLBACK_URL should end with /auth/google/callback");
  }

  if (!config.frontendUrl) {
    errors.push("❌ FRONTEND_URL is not set");
  } else if (!config.frontendUrl.startsWith("http")) {
    errors.push("❌ FRONTEND_URL should start with http:// or https://");
  }

  if (errors.length > 0) {
    console.log("🔍 Google OAuth Configuration Errors:");
    errors.forEach((error) => console.log(error));
    console.log("\n📋 Required environment variables:");
    console.log("GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com");
    console.log("GOOGLE_CLIENT_SECRET=your-client-secret");
    console.log(
      "GOOGLE_CALLBACK_URL=http://localhost:5001/auth/google/callback"
    );
    console.log("FRONTEND_URL=http://localhost:3000");
    process.exit(1);
  }

  return config;
}

function displayConfig(config: GoogleOAuthConfig) {
  console.log("✅ Google OAuth Configuration:");
  console.log(`   Client ID: ${config.clientId.substring(0, 20)}...`);
  console.log(`   Client Secret: ${config.clientSecret.substring(0, 10)}...`);
  console.log(`   Callback URL: ${config.callbackUrl}`);
  console.log(`   Frontend URL: ${config.frontendUrl}`);
}

async function testGoogleOAuthEndpoint() {
  console.log("\n🔍 Testing Google OAuth endpoints...");

  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    const testUrl = `${backendUrl}/auth/google`;

    console.log(`🌐 Testing endpoint: ${testUrl}`);

    const response = await fetch(testUrl, {
      method: "GET",
      redirect: "manual", // Don't follow redirects
    });

    if (response.status === 302) {
      const location = response.headers.get("location");
      if (location && location.includes("accounts.google.com")) {
        console.log("✅ Google OAuth redirect working correctly");
        console.log(`   Redirects to: ${location.substring(0, 50)}...`);
      } else {
        console.log("❌ OAuth redirect not pointing to Google");
        console.log(`   Location: ${location}`);
      }
    } else {
      console.log(`❌ Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log("❌ Error testing endpoint:", error.message);
    console.log("   Make sure backend is running on the correct port");
  }
}

function displayTestInstructions() {
  console.log("\n📋 Testing Instructions:");
  console.log("1. Start the backend server:");
  console.log("   cd backend && npm run start:dev");
  console.log("");
  console.log("2. Test the Google OAuth flow:");
  console.log("   Open: http://localhost:5001/auth/google");
  console.log("   - Should redirect to Google login");
  console.log("   - After login, should redirect to frontend callback");
  console.log("");
  console.log("3. Check the logs for debug information");
  console.log("");
  console.log("4. If you encounter issues:");
  console.log("   - Check Google Cloud Console settings");
  console.log("   - Verify authorized redirect URIs");
  console.log("   - Check CORS settings in backend");
  console.log("   - Verify JWT_SECRET is set");
}

async function main() {
  console.log("🔍 Google OAuth Configuration Test\n");

  try {
    const config = validateGoogleOAuthConfig();
    displayConfig(config);

    await testGoogleOAuthEndpoint();

    displayTestInstructions();

    console.log("\n✅ Google OAuth configuration appears to be correct");
    console.log("🔄 You can now test the full OAuth flow");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
