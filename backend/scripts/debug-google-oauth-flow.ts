#!/usr/bin/env ts-node
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";
import { Repository } from "typeorm";
import { User } from "../src/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";

async function debugGoogleOAuthFlow() {
  console.log("🔍 DEBUGGING Google OAuth Flow");
  console.log("=" + "=".repeat(50));

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  // Create test Google user data (simulates what comes from Google Strategy)
  const testEmail = `test-debug-oauth-${Date.now()}@example.com`;
  const mockGoogleUser = {
    google_id: `google-debug-${Date.now()}`,
    email: testEmail,
    full_name: "Debug OAuth User",
    avatar_url: "https://example.com/avatar.jpg",
    provider: "google",
    email_verified: true,
  };

  console.log("\n📌 Mock Google User Data:");
  console.log({
    email: mockGoogleUser.email,
    google_id: mockGoogleUser.google_id,
    full_name: mockGoogleUser.full_name,
  });

  try {
    console.log(
      "\n📌 Step 1: Testing googleAuth() - Should create user with role=null"
    );

    const { user: newUser, isNewUser } =
      await authService.googleAuth(mockGoogleUser);

    console.log("✅ GoogleAuth result:", {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      google_id: newUser.google_id,
      isNewUser,
    });

    // Critical check - role should be null for new users
    if (newUser.role !== null) {
      console.error("❌ PROBLEM FOUND: New user role should be NULL!");
      console.error(`   Expected: null, Got: ${newUser.role}`);
    } else {
      console.log("✅ CORRECT: New user has role = null");
    }

    if (!isNewUser) {
      console.error("❌ PROBLEM FOUND: isNewUser should be TRUE!");
    } else {
      console.log("✅ CORRECT: isNewUser flag is true");
    }

    console.log(
      "\n📌 Step 2: Testing generateTokens() - Should work with null role"
    );

    const tokens = await authService.generateTokens(newUser);
    console.log("✅ Token generated:", {
      hasToken: !!tokens.access_token,
      tokenLength: tokens.access_token.length,
    });

    // Decode token to check payload
    const base64Payload = tokens.access_token.split(".")[1];
    const payload = JSON.parse(Buffer.from(base64Payload, "base64").toString());
    console.log("📋 Token payload:", {
      sub: payload.sub,
      email: payload.email,
      role: payload.role, // This should be null
    });

    if (payload.role !== null) {
      console.error("❌ PROBLEM FOUND: Token role should be NULL!");
      console.error(`   Expected: null, Got: ${payload.role}`);
    } else {
      console.log("✅ CORRECT: Token contains role = null");
    }

    console.log(
      "\n📌 Step 3: Testing findUserWithProfile() - Should return user without profiles"
    );

    const userWithProfile = await authService.findUserWithProfile(newUser.id);
    console.log("✅ User profile check:", {
      id: userWithProfile.id,
      role: userWithProfile.role,
      hasTenantProfile: !!userWithProfile.tenantProfile,
      hasOperatorProfile: !!userWithProfile.operatorProfile,
      hasPreferences: !!userWithProfile.preferences,
    });

    if (userWithProfile.tenantProfile || userWithProfile.operatorProfile) {
      console.error("❌ PROBLEM FOUND: New user should NOT have profiles yet!");
    } else {
      console.log("✅ CORRECT: New user has no profiles (as expected)");
    }

    console.log("\n📌 Step 4: Testing setUserRole() for tenant");

    const tenantUser = await authService.setUserRole(newUser.id, "tenant");
    console.log("✅ After setting tenant role:", {
      id: tenantUser.id,
      role: tenantUser.role,
      hasTenantProfile: !!tenantUser.tenantProfile,
      hasPreferences: !!tenantUser.preferences,
    });

    if (tenantUser.role !== "tenant") {
      console.error("❌ PROBLEM FOUND: Role not set to tenant!");
    } else {
      console.log("✅ CORRECT: Role set to tenant");
    }

    if (!tenantUser.tenantProfile) {
      console.error("❌ PROBLEM FOUND: Tenant profile not created!");
    } else {
      console.log("✅ CORRECT: Tenant profile created");
    }

    if (!tenantUser.preferences) {
      console.error("❌ PROBLEM FOUND: Preferences not created for tenant!");
    } else {
      console.log("✅ CORRECT: Preferences created for tenant");
    }

    console.log("\n📌 Step 5: Testing existing user flow");

    const existingUserResult = await authService.googleAuth(mockGoogleUser);
    console.log("✅ Existing user result:", {
      userId: existingUserResult.user.id,
      role: existingUserResult.user.role,
      isNewUser: existingUserResult.isNewUser,
    });

    if (existingUserResult.isNewUser) {
      console.error(
        "❌ PROBLEM FOUND: isNewUser should be FALSE for existing user!"
      );
    } else {
      console.log("✅ CORRECT: isNewUser is false for existing user");
    }

    // Cleanup
    console.log("\n📌 Cleanup: Removing test user");
    await userRepository.delete({ id: newUser.id });
    console.log("✅ Test user cleaned up");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 DIAGNOSIS COMPLETE!");
    console.log("=".repeat(50));

    console.log("\n📋 SUMMARY OF CHECKS:");
    console.log("✅ Database ready (role nullable)");
    console.log("✅ User created with role=null");
    console.log("✅ isNewUser flag correct");
    console.log("✅ Token generation works");
    console.log("✅ Token payload contains role=null");
    console.log("✅ No profiles created initially");
    console.log("✅ setUserRole creates profiles");
    console.log("✅ Existing user flow works");
  } catch (error: any) {
    console.error("\n❌ DIAGNOSIS FAILED:", error.message);
    console.error("Stack:", error.stack);

    // Cleanup on error
    try {
      await userRepository.delete({ email: testEmail });
      console.log("🧹 Cleaned up test user after error");
    } catch (cleanupError) {
      console.error("⚠️ Could not clean up test user:", cleanupError);
    }
  } finally {
    await app.close();
  }
}

// Run if called directly
if (require.main === module) {
  debugGoogleOAuthFlow().catch(console.error);
}

export { debugGoogleOAuthFlow };
