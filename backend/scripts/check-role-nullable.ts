#!/usr/bin/env ts-node
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { DataSource } from "typeorm";

async function checkRoleNullable() {
  console.log("🔍 Checking if role column is nullable...");

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Query the column information
    const result = await dataSource.query(`
      SELECT 
        column_name,
        is_nullable,
        column_default,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'role'
    `);

    console.log("📋 Role column information:", result);

    if (result.length === 0) {
      console.error("❌ Role column not found in users table");
      return;
    }

    const roleColumn = result[0];

    if (roleColumn.is_nullable === "YES") {
      console.log("✅ Role column is nullable - migration was successful!");
    } else {
      console.error(
        "❌ Role column is NOT nullable - migration may not have been applied"
      );
    }

    if (roleColumn.column_default === null) {
      console.log("✅ Role column has no default value");
    } else {
      console.warn(
        "⚠️ Role column still has default value:",
        roleColumn.column_default
      );
    }

    // Test creating a user with null role
    console.log("🔍 Testing user creation with null role...");

    const testEmail = `test-null-role-${Date.now()}@example.com`;

    try {
      await dataSource.query(
        `
        INSERT INTO users (id, email, role, status, password, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, NULL, 'active', 'test_password', NOW(), NOW())
      `,
        [testEmail]
      );

      console.log("✅ Successfully created user with null role");

      // Clean up test user
      await dataSource.query(`DELETE FROM users WHERE email = $1`, [testEmail]);
      console.log("✅ Test user cleaned up");
    } catch (error) {
      console.error("❌ Failed to create user with null role:", error.message);
    }
  } catch (error) {
    console.error("❌ Error checking role column:", error);
  } finally {
    await app.close();
  }
}

// Run if called directly
if (require.main === module) {
  checkRoleNullable().catch(console.error);
}

export { checkRoleNullable };
