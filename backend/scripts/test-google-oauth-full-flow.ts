#!/usr/bin/env ts-node
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";
import { Repository } from "typeorm";
import { User } from "../src/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

async function testGoogleOAuthFullFlow() {
  console.log("🧪 Testing Full Google OAuth Flow for New User");
  console.log("=" + "=".repeat(50));

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const jwtService = app.get(JwtService);

  // Create unique test email
  const testEmail = `test-oauth-${Date.now()}@example.com`;
  const mockGoogleUser = {
    google_id: `google-${Date.now()}`,
    email: testEmail,
    full_name: "Test OAuth User",
    avatar_url: "https://example.com/avatar.jpg",
    provider: "google",
    email_verified: true,
  };

  try {
    console.log("\n📌 Step 1: Simulating Google OAuth Authentication");
    console.log("Mock Google user data:", {
      email: mockGoogleUser.email,
      google_id: mockGoogleUser.google_id,
      full_name: mockGoogleUser.full_name,
    });

    // Step 1: Create user through Google OAuth
    console.log("\n📌 Step 2: Creating user through googleAuth()");
    const { user: newUser, isNewUser } =
      await authService.googleAuth(mockGoogleUser);

    console.log("✅ User created:", {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      isNewUser,
    });

    // Verify user has no role
    if (newUser.role !== null) {
      throw new Error(`Expected role to be null, but got: ${newUser.role}`);
    }
    console.log("✅ Confirmed: User created with role = null");

    // Step 2: Generate token
    console.log("\n📌 Step 3: Generating JWT token");
    const { access_token } = await authService.generateTokens(newUser);
    console.log("✅ Token generated successfully");

    // Decode token to verify contents
    const decodedToken = jwtService.decode(access_token) as any;
    console.log("📋 Token payload:", {
      sub: decodedToken.sub,
      email: decodedToken.email,
      role: decodedToken.role,
    });

    // Step 3: Simulate frontend checking user profile
    console.log("\n📌 Step 4: Simulating frontend profile check");
    const userProfile = await authService.findUserWithProfile(newUser.id);
    console.log("✅ User profile retrieved:", {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      hasTenantProfile: !!userProfile.tenantProfile,
      hasOperatorProfile: !!userProfile.operatorProfile,
    });

    // Verify no profiles exist yet
    if (userProfile.tenantProfile || userProfile.operatorProfile) {
      throw new Error("User should not have any profiles yet");
    }
    console.log("✅ Confirmed: No profiles created yet");

    // Step 4: Set role as Tenant
    console.log("\n📌 Step 5: Setting role as TENANT");
    const tenantUser = await authService.setUserRole(newUser.id, "tenant");

    console.log("✅ Role set successfully:", {
      id: tenantUser.id,
      role: tenantUser.role,
      hasTenantProfile: !!tenantUser.tenantProfile,
      hasPreferences: !!tenantUser.preferences,
    });

    // Verify tenant profile created
    if (!tenantUser.tenantProfile) {
      throw new Error("Tenant profile should have been created");
    }
    if (!tenantUser.preferences) {
      throw new Error("Preferences should have been created");
    }
    console.log("✅ Confirmed: Tenant profile and preferences created");

    // Step 5: Test setting role for Operator
    console.log("\n📌 Step 6: Testing OPERATOR role (with new user)");

    // Create another test user
    const operatorEmail = `test-operator-${Date.now()}@example.com`;
    const mockOperatorUser = {
      ...mockGoogleUser,
      email: operatorEmail,
      google_id: `google-op-${Date.now()}`,
    };

    const { user: operatorUser } =
      await authService.googleAuth(mockOperatorUser);
    const operatorWithRole = await authService.setUserRole(
      operatorUser.id,
      "operator"
    );

    console.log("✅ Operator role set:", {
      id: operatorWithRole.id,
      role: operatorWithRole.role,
      hasOperatorProfile: !!operatorWithRole.operatorProfile,
    });

    // Verify operator profile created
    if (!operatorWithRole.operatorProfile) {
      throw new Error("Operator profile should have been created");
    }
    console.log("✅ Confirmed: Operator profile created");

    // Step 6: Test error handling
    console.log("\n📌 Step 7: Testing error handling");

    try {
      // Try to set role again (should fail)
      await authService.setUserRole(tenantUser.id, "operator");
      throw new Error("Should not allow role change");
    } catch (error: any) {
      if (error.message.includes("already has a role")) {
        console.log(
          "✅ Correctly prevented role change for user with existing role"
        );
      } else {
        throw error;
      }
    }

    // Cleanup
    console.log("\n📌 Step 8: Cleaning up test users");
    await userRepository.delete({ id: newUser.id });
    await userRepository.delete({ id: operatorUser.id });
    console.log("✅ Test users cleaned up");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 ALL TESTS PASSED! Google OAuth flow is working correctly.");
    console.log("=".repeat(50));

    console.log("\n📋 Summary:");
    console.log("✅ User creation with null role");
    console.log("✅ Token generation");
    console.log("✅ Profile retrieval");
    console.log("✅ Role setting (Tenant)");
    console.log("✅ Profile creation (Tenant + Preferences)");
    console.log("✅ Role setting (Operator)");
    console.log("✅ Profile creation (Operator)");
    console.log("✅ Error handling (prevent role change)");
  } catch (error: any) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error("Stack:", error.stack);

    // Cleanup on error
    try {
      const testUsers = await userRepository.find({
        where: [
          { email: testEmail },
          { email: Like(`test-oauth-%@example.com`) },
          { email: Like(`test-operator-%@example.com`) },
        ],
      });

      for (const user of testUsers) {
        await userRepository.delete({ id: user.id });
      }
      console.log("🧹 Cleaned up test users after error");
    } catch (cleanupError) {
      console.error("⚠️ Could not clean up test users:", cleanupError);
    }
  } finally {
    await app.close();
  }
}

// Import for LIKE operator
import { Like } from "typeorm";

// Run if called directly
if (require.main === module) {
  testGoogleOAuthFullFlow().catch(console.error);
}

export { testGoogleOAuthFullFlow };
