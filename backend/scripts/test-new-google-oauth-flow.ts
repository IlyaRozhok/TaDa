#!/usr/bin/env ts-node
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";
import { PendingGoogleRegistrationService } from "../src/modules/auth/services/pending-google-registration.service";
import { Repository } from "typeorm";
import { User } from "../src/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";

async function testNewGoogleOAuthFlow() {
  console.log("🧪 Testing UPDATED Google OAuth Flow with TempTokens");
  console.log("=" + "=".repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const pendingService = app.get(PendingGoogleRegistrationService);
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
    console.log("\n📌 Step 1: Testing checkGoogleUser() for NEW user");
    console.log("Mock Google user:", {
      email: mockGoogleUser.email,
      google_id: mockGoogleUser.google_id,
    });

    // Step 1: Check if user exists (should create tempToken for new user)
    const checkResult = await authService.checkGoogleUser(mockGoogleUser);

    console.log("✅ Check result:", {
      hasUser: !!checkResult.user,
      hasTempToken: !!checkResult.tempToken,
    });

    if (checkResult.user !== undefined) {
      throw new Error("Expected user to be undefined for new user");
    }

    if (!checkResult.tempToken) {
      throw new Error("Expected tempToken to be created for new user");
    }

    console.log(`✅ TempToken created: ${checkResult.tempToken}`);

    // Step 2: Validate temp token info
    console.log("\n📌 Step 2: Testing getTempTokenInfo()");
    const tempTokenInfo = authService.getTempTokenInfo(checkResult.tempToken);

    if (!tempTokenInfo) {
      throw new Error("TempToken info should be available");
    }

    console.log("✅ TempToken info:", {
      email: tempTokenInfo.googleUserData.email,
      expires: tempTokenInfo.expiresAt,
      isValid: tempTokenInfo.expiresAt > new Date(),
    });

    // Step 3: Create user with role using temp token
    console.log("\n📌 Step 3: Testing createGoogleUserWithRole()");
    const createdUser = await authService.createGoogleUserWithRole(
      checkResult.tempToken,
      "tenant"
    );

    console.log("✅ User created:", {
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      hasTenantProfile: !!createdUser.tenantProfile,
      hasPreferences: !!createdUser.preferences,
    });

    if (createdUser.email !== testEmail) {
      throw new Error("Created user email doesn't match");
    }

    if (createdUser.role !== "tenant") {
      throw new Error("Created user role should be tenant");
    }

    // Step 4: Test temp token is cleaned up
    console.log("\n📌 Step 4: Testing tempToken cleanup");
    const expiredTokenInfo = authService.getTempTokenInfo(
      checkResult.tempToken
    );

    if (expiredTokenInfo) {
      throw new Error("TempToken should be cleaned up after user creation");
    }

    console.log("✅ TempToken properly cleaned up");

    // Step 5: Test existing user flow
    console.log("\n📌 Step 5: Testing checkGoogleUser() for EXISTING user");
    const existingUserCheck = await authService.checkGoogleUser(mockGoogleUser);

    console.log("✅ Existing user check result:", {
      hasUser: !!existingUserCheck.user,
      hasTempToken: !!existingUserCheck.tempToken,
    });

    if (!existingUserCheck.user) {
      throw new Error("Expected to find existing user");
    }

    if (existingUserCheck.tempToken) {
      throw new Error("Should not create tempToken for existing user");
    }

    // Step 6: Test operator role creation
    console.log("\n📌 Step 6: Testing operator role creation");
    const operatorEmail = `operator-${Date.now()}@example.com`;
    const operatorGoogleUser = {
      google_id: `google-op-${Date.now()}`,
      email: operatorEmail,
      full_name: "Test Operator",
      avatar_url: "https://example.com/op-avatar.jpg",
      email_verified: true,
    };

    const opCheckResult = await authService.checkGoogleUser(operatorGoogleUser);
    const operatorUser = await authService.createGoogleUserWithRole(
      opCheckResult.tempToken!,
      "operator"
    );

    console.log("✅ Operator created:", {
      id: operatorUser.id,
      email: operatorUser.email,
      role: operatorUser.role,
      hasOperatorProfile: !!operatorUser.operatorProfile,
    });

    if (operatorUser.role !== "operator") {
      throw new Error("Created user role should be operator");
    }

    console.log("\n🎉 ALL TESTS PASSED!");
    console.log("✅ New Google OAuth Flow works correctly");

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await userRepository.delete({ email: testEmail });
    await userRepository.delete({ email: operatorEmail });
    console.log("✅ Test data cleaned up");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);

    // Cleanup on error
    try {
      await userRepository.delete({ email: testEmail });
      await userRepository.delete({
        email: `operator-${Date.now()}@example.com`,
      });
    } catch (cleanupError) {
      console.error("Failed to cleanup test data:", cleanupError);
    }

    throw error;
  } finally {
    await app.close();
  }
}

// Run the test
if (require.main === module) {
  testNewGoogleOAuthFlow()
    .then(() => {
      console.log("\n✅ Test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test failed:", error);
      process.exit(1);
    });
}

export default testNewGoogleOAuthFlow;
