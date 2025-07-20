#!/usr/bin/env ts-node
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";
import { Repository } from "typeorm";
import { User } from "../src/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";

async function testProfileLoading() {
  console.log("🔍 Testing profile loading for users");

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  try {
    // Get all users to see their data structure
    const users = await userRepository.find({
      relations: ["tenantProfile", "operatorProfile", "preferences"],
      select: [
        "id",
        "email",
        "role",
        "status",
        "full_name",
        "provider",
        "google_id",
        "avatar_url",
      ],
    });

    console.log(`Found ${users.length} users:`);

    for (const user of users) {
      console.log(`\n👤 User: ${user.email}`);
      console.log("   Role:", user.role);
      console.log("   Full Name:", user.full_name);
      console.log("   Provider:", user.provider);
      console.log("   Tenant Profile:", {
        exists: !!user.tenantProfile,
        full_name: user.tenantProfile?.full_name || null,
      });
      console.log("   Operator Profile:", {
        exists: !!user.operatorProfile,
        full_name: user.operatorProfile?.full_name || null,
      });

      // Test the composite full_name logic from controller
      const compositeName =
        user.full_name ||
        user.tenantProfile?.full_name ||
        user.operatorProfile?.full_name ||
        null;
      console.log("   Composite Name:", compositeName);

      console.log("   ---------------");
    }

    // Test the findUserWithProfile method specifically
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n🔍 Testing findUserWithProfile for: ${testUser.email}`);

      const fullUser = await authService.findUserWithProfile(testUser.id);
      console.log("Result from findUserWithProfile:", {
        id: fullUser.id,
        email: fullUser.email,
        role: fullUser.role,
        full_name: fullUser.full_name,
        tenantProfile: fullUser.tenantProfile
          ? {
              id: fullUser.tenantProfile.id,
              full_name: fullUser.tenantProfile.full_name,
            }
          : null,
        operatorProfile: fullUser.operatorProfile
          ? {
              id: fullUser.operatorProfile.id,
              full_name: fullUser.operatorProfile.full_name,
            }
          : null,
      });

      // Simulate the controller logic
      const controllerResult = {
        ...fullUser,
        full_name:
          fullUser.full_name ||
          fullUser.tenantProfile?.full_name ||
          fullUser.operatorProfile?.full_name ||
          null,
      };

      console.log("Final result sent to frontend:", {
        id: controllerResult.id,
        email: controllerResult.email,
        role: controllerResult.role,
        full_name: controllerResult.full_name,
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await app.close();
  }
}

testProfileLoading().catch(console.error);
