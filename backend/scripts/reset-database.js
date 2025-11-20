#!/usr/bin/env node

/**
 * 🔄 Database Reset Script
 *
 * This script completely resets the database by:
 * 1. Dropping all tables (including migrations table)
 * 2. Re-running all migrations
 * 3. Optionally running seed script
 *
 * WARNING: This will DELETE ALL DATA in the database!
 *
 * Usage:
 *   node scripts/reset-database.js [--seed]
 *
 * Environment variables required:
 *   - DB_HOST
 *   - DB_PORT
 *   - DB_USERNAME
 *   - DB_PASSWORD
 *   - DB_NAME
 */

const { Client } = require("pg");
const { execSync } = require("child_process");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const shouldSeed = args.includes("--seed");

// Load environment variables (optional - will use system env if dotenv not available)
try {
  require("dotenv").config();
} catch (e) {
  // dotenv is optional - will use system environment variables
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "rental_platform",
};

console.log("🔄 Database Reset Script");
console.log("=".repeat(50));
console.log(`📊 Database: ${dbConfig.database}`);
console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`👤 User: ${dbConfig.user}`);
console.log("");

// Function to drop all tables
async function dropAllTables(client) {
  async function dropAllTables(client) {
    console.log("🗑️  Dropping all tables...");

    await client.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT tablename
          FROM pg_tables
          WHERE schemaname = 'public'
        ) LOOP
          EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
        END LOOP;
      END
      $$;
    `);

    console.log("✅ All tables dropped");
  }
}

// Function to run migrations
async function runMigrations() {
  console.log("");
  console.log("🚀 Running migrations...");
  console.log("=".repeat(50));

  try {
    // Check if we need to build first
    const distPath = path.join(
      __dirname,
      "..",
      "dist",
      "database",
      "data-source.js"
    );
    const fs = require("fs");

    if (!fs.existsSync(distPath)) {
      console.log("📦 Building project first...");
      execSync("npm run build", {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit",
      });
    }

    // Run migrations
    console.log("🔄 Applying migrations...");
    execSync("npm run migration:run:prod", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      env: { ...process.env },
    });

    console.log("✅ Migrations applied successfully");
  } catch (error) {
    console.error("❌ Error running migrations:", error.message);
    throw error;
  }
}

// Function to run seed script
async function runSeed() {
  if (!shouldSeed) {
    return;
  }

  console.log("");
  console.log("🌱 Running seed script...");
  console.log("=".repeat(50));

  try {
    // Determine which seed script to use
    // Check if DB_HOST contains 'stage' or if NODE_ENV is staging
    const isStaging =
      (process.env.DB_HOST && process.env.DB_HOST.includes("stage")) ||
      process.env.NODE_ENV === "production" ||
      process.env.NODE_ENV === "prod";

    const seedScript = isStaging ? "seed-staging.js" : "seed-database.js";
    console.log(`📝 Using seed script: ${seedScript}`);

    execSync(`node scripts/${seedScript}`, {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      env: { ...process.env },
    });

    console.log("✅ Seed script completed successfully");
  } catch (error) {
    console.error("❌ Error running seed script:", error.message);
    throw error;
  }
}

// Main function
async function main() {
  const client = new Client(dbConfig);

  try {
    // Connect to database
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to database");
    console.log("");

    // Confirm before proceeding
    if (!process.env.SKIP_CONFIRMATION) {
      console.log("⚠️  WARNING: This will DELETE ALL DATA in the database!");
      console.log(
        "⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue..."
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Drop all tables
    await dropAllTables(client);

    // Close connection
    await client.end();

    // Run migrations
    await runMigrations();

    // Run seed if requested
    await runSeed();

    console.log("");
    console.log("🎉 Database reset completed successfully!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("");
    console.error("❌ Database reset failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (!client.ended) {
      await client.end();
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { main };
