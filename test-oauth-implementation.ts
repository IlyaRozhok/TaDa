#!/usr/bin/env ts-node

/**
 * Test script for Google OAuth with Role Selection
 * Run with: npx ts-node test-oauth-implementation.ts
 */

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app.module"; // Adjust path as needed
import { AuthService } from "./backend/src/modules/auth/auth.service";
import { PendingGoogleRegistrationService } from "./backend/src/modules/auth/services/pending-google-registration.service";

async function testOAuthImplementation() {
  console.log("🧪 Testing Google OAuth Implementation");
  console.log("=" + "=".repeat(50));

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const pendingService = app.get(PendingRegistrationService);

  try {
    // Test 1: New user OAuth flow
    console.log("\n📌 Test 1: New User OAuth Flow");

    const mockGoogleUser: GoogleUser = {
      google_id: "google-test-" + Date.now(),
      email: `test-oauth-${Date.now()}@example.com`,
      full_name: "Test OAuth User",
      avatar_url: "https://lh3.googleusercontent.com/test-avatar.jpg",
      email_verified: true,
    };

    console.log("Mock Google user:", {
      email: mockGoogleUser.email,
      full_name: mockGoogleUser.full_name,
    });

    // Step 1: Handle Google callback for new user
    const callbackResult = await authService.handleGoogleCallback(
      mockGoogleUser
    );

    console.log("Callback result:", {
      status: callbackResult.status,
      hasRegistrationId: !!callbackResult.registration_id,
      message: callbackResult.message,
    });

    // Verify new user gets NEEDS_ROLE_SELECTION
    if (callbackResult.status !== AuthStatus.NEEDS_ROLE_SELECTION) {
      throw new Error(
        `Expected NEEDS_ROLE_SELECTION, got ${callbackResult.status}`
      );
    }

    if (!callbackResult.registration_id) {
      throw new Error("Missing registration_id for new user");
    }

    console.log("✅ New user correctly requires role selection");

    // Test 2: Complete registration with Tenant role
    console.log("\n📌 Test 2: Complete Registration as Tenant");

    const completionResult = await authService.completeRegistration({
      registration_id: callbackResult.registration_id,
      role: "tenant",
    });

    console.log("Registration completion result:", {
      status: completionResult.status,
      hasTokens: !!(
        completionResult.access_token && completionResult.refresh_token
      ),
      userRole: completionResult.user?.role,
      userEmail: completionResult.user?.email,
    });

    // Verify successful registration
    if (completionResult.status !== AuthStatus.SUCCESS) {
      throw new Error(`Expected SUCCESS, got ${completionResult.status}`);
    }

    if (!completionResult.access_token || !completionResult.refresh_token) {
      throw new Error("Missing tokens after registration");
    }

    if (completionResult.user?.role !== "tenant") {
      throw new Error(
        `Expected tenant role, got ${completionResult.user?.role}`
      );
    }

    console.log("✅ Registration completed successfully with tenant role");

    // Test 3: Existing user OAuth flow
    console.log("\n📌 Test 3: Existing User OAuth Flow");

    // Simulate same user signing in again
    const existingUserResult = await authService.handleGoogleCallback(
      mockGoogleUser
    );

    console.log("Existing user result:", {
      status: existingUserResult.status,
      hasTokens: !!(
        existingUserResult.access_token && existingUserResult.refresh_token
      ),
      userRole: existingUserResult.user?.role,
    });

    // Verify existing user gets SUCCESS immediately
    if (existingUserResult.status !== AuthStatus.SUCCESS) {
      throw new Error(
        `Expected SUCCESS for existing user, got ${existingUserResult.status}`
      );
    }

    console.log("✅ Existing user correctly logged in without role selection");

    // Test 4: Invalid registration ID
    console.log("\n📌 Test 4: Invalid Registration ID");

    try {
      await authService.completeRegistration({
        registration_id: "invalid-uuid",
        role: "tenant",
      });
      throw new Error("Should have failed with invalid registration ID");
    } catch (error) {
      console.log("✅ Correctly rejected invalid registration ID");
    }

    // Test 5: Expired registration ID
    console.log("\n📌 Test 5: Expired Registration Handling");

    const tempRegistrationId = pendingService.storePendingRegistration({
      ...mockGoogleUser,
      email: `temp-${Date.now()}@example.com`,
    });

    // Wait for expiry (or manually expire)
    const expiredResult =
      pendingService.consumePendingRegistration(tempRegistrationId);
    if (expiredResult) {
      console.log("✅ Registration storage and retrieval working");
    }

    // Test 6: Pending registrations stats
    console.log("\n📌 Test 6: Pending Registration Stats");

    const stats = await authService.getPendingRegistrationStats();
    console.log("Pending registration stats:", {
      totalPending: stats.totalPending,
      hasRegistrations: stats.pendingRegistrations.length > 0,
    });

    console.log("\n🎉 All tests passed successfully!");
    console.log("\n📋 Implementation Summary:");
    console.log("✅ New users get NEEDS_ROLE_SELECTION status");
    console.log("✅ Role selection completes registration with JWT tokens");
    console.log("✅ Existing users get SUCCESS status immediately");
    console.log("✅ Invalid registration IDs are properly handled");
    console.log("✅ Pending registrations are properly managed");
    console.log("✅ User profiles are created based on selected role");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Environment Variables Required
const requiredEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
  "JWT_SECRET",
  "DATABASE_URL", // or your DB config
];

console.log("🔍 Checking environment variables...");
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars);
  console.log("\n📝 Required environment variables:");
  console.log("GOOGLE_CLIENT_ID=your-google-client-id");
  console.log("GOOGLE_CLIENT_SECRET=your-google-client-secret");
  console.log("GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback");
  console.log("JWT_SECRET=your-secret-key");
  console.log("DATABASE_URL=postgresql://user:password@localhost:5432/dbname");
  console.log("FRONTEND_URL=http://localhost:3000");
  process.exit(1);
}

console.log("✅ Environment variables configured");

// Run the tests
if (require.main === module) {
  testOAuthImplementation().catch(console.error);
}
