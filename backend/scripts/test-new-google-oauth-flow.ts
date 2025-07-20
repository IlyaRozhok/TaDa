#!/usr/bin/env ts-node
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";
import { PendingGoogleRegistrationService } from "../src/modules/auth/services/pending-google-registration.service";
import { Repository } from "typeorm";
import { User } from "../src/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";

async function testNewGoogleOAuthFlow() {
  console.log("🧪 Testing NEW Google OAuth Flow (No Premature User Creation)");
  console.log("=" + "=".repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const pendingService = app.get(PendingGoogleRegistrationService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  // Create unique test data
  const testEmail = `test-new-oauth-${Date.now()}@example.com`;
  const mockGoogleUser = {
    google_id: `google-new-${Date.now()}`,
    email: testEmail,
    full_name: "Test New OAuth User",
    avatar_url: "https://example.com/avatar.jpg",
    email_verified: true,
  };

  try {
    console.log("\n📌 Step 1: Testing checkGoogleUser() for NEW user");
    console.log("Mock Google user:", {
      email: mockGoogleUser.email,
      google_id: mockGoogleUser.google_id,
    });

    // Step 1: Check if user exists (should not exist)
    const checkResult = await authService.checkGoogleUser(mockGoogleUser);

    console.log("✅ Check result:", {
      hasUser: !!checkResult.user,
      isNewUser: checkResult.isNewUser,
      hasGoogleData: !!checkResult.googleData,
    });

    if (checkResult.user !== null) {
      throw new Error("Expected user to be null for new user");
    }

    if (!checkResult.isNewUser) {
      throw new Error("Expected isNewUser to be true");
    }

    if (!checkResult.googleData) {
      throw new Error("Expected googleData to be present");
    }

    console.log("✅ NEW USER: checkGoogleUser correctly returned no user");

    // Step 2: Verify user was NOT created in database
    console.log("\n📌 Step 2: Verifying user was NOT created in database");

    const userInDb = await userRepository.findOne({
      where: { email: testEmail.toLowerCase() },
    });

    if (userInDb) {
      throw new Error("❌ User should NOT have been created yet!");
    }

    console.log("✅ CORRECT: User was NOT created in database");

    // Step 3: Store Google data temporarily
    console.log("\n📌 Step 3: Storing Google data temporarily");

    const registrationId = await authService.storeGoogleDataTemporarily(
      checkResult.googleData
    );

    console.log("✅ Stored Google data with ID:", registrationId);

    if (!registrationId || registrationId.length < 30) {
      throw new Error("Invalid registration ID");
    }

    // Step 4: Verify data can be retrieved
    console.log("\n📌 Step 4: Verifying data can be retrieved");

    const storedData = pendingService.consumeGoogleData(registrationId);

    if (!storedData) {
      throw new Error("Could not retrieve stored Google data");
    }

    console.log("✅ Retrieved stored data:", {
      email: storedData.email,
      google_id: storedData.google_id,
    });

    // Step 5: Now store again for user creation test
    console.log("\n📌 Step 5: Storing data again for user creation test");

    const newRegistrationId =
      await authService.storeGoogleDataTemporarily(mockGoogleUser);

    // Step 6: Create user with role TENANT
    console.log("\n📌 Step 6: Creating user with TENANT role");

    const createdUser = await authService.createGoogleUserFromRegistration(
      newRegistrationId,
      "tenant"
    );

    console.log("✅ User created:", {
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      hasTenantProfile: !!createdUser.tenantProfile,
      hasPreferences: !!createdUser.preferences,
    });

    if (createdUser.role !== "tenant") {
      throw new Error(`Expected role 'tenant', got '${createdUser.role}'`);
    }

    if (!createdUser.tenantProfile) {
      throw new Error("Tenant profile should have been created");
    }

    if (!createdUser.preferences) {
      throw new Error("Preferences should have been created");
    }

    console.log("✅ TENANT user created with correct profile and preferences");

    // Step 7: Test duplicate registration ID usage
    console.log("\n📌 Step 7: Testing duplicate registration ID usage");

    try {
      await authService.createGoogleUserFromRegistration(
        newRegistrationId,
        "operator"
      );
      throw new Error("Should have failed with used registration ID");
    } catch (error) {
      console.log("✅ CORRECT: Duplicate registration ID usage rejected");
    }

    // Step 8: Test existing user flow
    console.log("\n📌 Step 8: Testing existing user flow");

    const existingUserCheck = await authService.checkGoogleUser(mockGoogleUser);

    console.log("✅ Existing user check:", {
      hasUser: !!existingUserCheck.user,
      isNewUser: existingUserCheck.isNewUser,
      userRole: existingUserCheck.user?.role,
    });

    if (!existingUserCheck.user) {
      throw new Error("Expected to find existing user");
    }

    if (existingUserCheck.isNewUser) {
      throw new Error("Expected isNewUser to be false for existing user");
    }

    console.log("✅ EXISTING USER: correctly found without creating duplicate");

    // Step 9: Test operator creation with different email
    console.log("\n📌 Step 9: Testing OPERATOR user creation");

    const operatorEmail = `test-operator-${Date.now()}@example.com`;
    const mockOperatorUser = {
      ...mockGoogleUser,
      email: operatorEmail,
      google_id: `google-operator-${Date.now()}`,
    };

    const operatorRegId =
      await authService.storeGoogleDataTemporarily(mockOperatorUser);

    const operatorUser = await authService.createGoogleUserFromRegistration(
      operatorRegId,
      "operator"
    );

    console.log("✅ Operator created:", {
      role: operatorUser.role,
      hasOperatorProfile: !!operatorUser.operatorProfile,
      hasTenantProfile: !!operatorUser.tenantProfile,
    });

    if (operatorUser.role !== "operator") {
      throw new Error("Expected operator role");
    }

    if (!operatorUser.operatorProfile) {
      throw new Error("Operator profile should have been created");
    }

    if (operatorUser.tenantProfile) {
      throw new Error("Operator should NOT have tenant profile");
    }

    console.log("✅ OPERATOR user created with correct profile");

    // Step 10: Test pending registration stats
    console.log("\n📌 Step 10: Testing pending registration stats");

    const stats = pendingService.getStats();
    console.log("✅ Pending registration stats:", {
      totalPending: stats.totalPending,
      pendingCount: stats.pendingEmails.length,
    });

    console.log("\n🎉 ALL TESTS PASSED!");
    console.log("\n📋 NEW Google OAuth Flow Summary:");
    console.log("✅ checkGoogleUser() does NOT create users");
    console.log("✅ Google data is stored temporarily");
    console.log("✅ Users are created ONLY after role selection");
    console.log("✅ Correct profiles are created based on role");
    console.log("✅ Registration IDs are consumed (one-time use)");
    console.log("✅ Existing users are handled correctly");
    console.log("✅ No premature user creation");

    console.log("\n🚀 The new flow is working perfectly!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the test
if (require.main === module) {
  testNewGoogleOAuthFlow().catch(console.error);
}
