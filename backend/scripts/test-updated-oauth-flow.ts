#!/usr/bin/env ts-node
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";
import { PendingGoogleRegistrationService } from "../src/modules/auth/services/pending-google-registration.service";
import { Repository } from "typeorm";
import { User } from "../src/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";

async function testUpdatedOAuthFlow() {
  console.log("🧪 Testing UPDATED OAuth Flow with TempToken System");
  console.log("=" + "=".repeat(70));

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  // Create unique test data
  const testEmail = `test-oauth-${Date.now()}@example.com`;
  const mockGoogleUser = {
    google_id: `google-${Date.now()}`,
    email: testEmail,
    full_name: "Test OAuth User",
    avatar_url: "https://example.com/avatar.jpg",
    email_verified: true,
  };

  try {
    console.log("\n🔍 Step 1: Testing NEW user - should create tempToken");
    console.log("Mock Google user:", {
      email: mockGoogleUser.email,
      google_id: mockGoogleUser.google_id,
    });

    // Step 1: Check Google user (new user)
    const result = await authService.checkGoogleUser(mockGoogleUser);

    console.log("✅ Result:", {
      hasUser: !!result.user,
      hasTempToken: !!result.tempToken,
    });

    if (result.user) {
      throw new Error("New user should not have user object");
    }

    if (!result.tempToken) {
      throw new Error("New user should have tempToken");
    }

    const tempToken = result.tempToken;
    console.log(`✅ TempToken created: ${tempToken.substring(0, 20)}...`);

    // Step 2: Validate temp token
    console.log("\n🔍 Step 2: Validating tempToken");
    const tokenInfo = authService.getTempTokenInfo(tempToken);

    if (!tokenInfo) {
      throw new Error("TempToken info should exist");
    }

    console.log("✅ TempToken info valid:", {
      email: tokenInfo.googleUserData.email,
      expires: tokenInfo.expiresAt,
      isValid: tokenInfo.expiresAt > new Date(),
    });

    // Step 3: Create user with role
    console.log("\n🔍 Step 3: Creating user with tenant role");
    const createdUser = await authService.createGoogleUserWithRole(
      tempToken,
      "tenant"
    );

    console.log("✅ User created:", {
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      hasProfile: !!createdUser.tenantProfile,
      hasPrefs: !!createdUser.preferences,
    });

    if (createdUser.email !== testEmail) {
      throw new Error("Email mismatch");
    }

    if (createdUser.role !== "tenant") {
      throw new Error("Role should be tenant");
    }

    // Step 4: Verify tempToken cleanup
    console.log("\n🔍 Step 4: Verifying tempToken cleanup");
    const cleanedTokenInfo = authService.getTempTokenInfo(tempToken);

    if (cleanedTokenInfo) {
      throw new Error("TempToken should be cleaned up");
    }

    console.log("✅ TempToken properly cleaned up");

    // Step 5: Test existing user
    console.log("\n🔍 Step 5: Testing EXISTING user - should return user");
    const existingResult = await authService.checkGoogleUser(mockGoogleUser);

    console.log("✅ Existing user result:", {
      hasUser: !!existingResult.user,
      hasTempToken: !!existingResult.tempToken,
    });

    if (!existingResult.user) {
      throw new Error("Should find existing user");
    }

    if (existingResult.tempToken) {
      throw new Error("Should not create tempToken for existing user");
    }

    console.log("\n🎉 ALL TESTS PASSED!");
    console.log("✅ Updated OAuth Flow working correctly");

    // Cleanup
    console.log("\n🧹 Cleaning up...");
    await userRepository.delete({ email: testEmail });
    console.log("✅ Cleanup completed");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);

    // Emergency cleanup
    try {
      await userRepository.delete({ email: testEmail });
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }

    throw error;
  } finally {
    await app.close();
  }
}

// Run if called directly
if (require.main === module) {
  testUpdatedOAuthFlow()
    .then(() => {
      console.log("\n✅ Test suite completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test suite failed:", error);
      process.exit(1);
    });
}

export default testUpdatedOAuthFlow;
