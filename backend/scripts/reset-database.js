#!/usr/bin/env node

/**
 * 🔄 Simple Database Reset Script
 *
 * 1. DROP SCHEMA public CASCADE;
 * 2. CREATE SCHEMA public;
 * 3. npm run migration:run:prod
 * 4. (optional) node scripts/seed-staging.js
 *
 * ВАЖНО: УДАЛИТ ВСЕ ДАННЫЕ В БАЗЕ!
 */

const { Client } = require("pg");
const { execSync } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const shouldSeed = args.includes("--seed");

// dotenv не обязателен, просто пробуем
try {
  require("dotenv").config();
} catch (e) {}

// Конфиг базы из env
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
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

// 1) Полный дроп схемы public
async function resetSchema() {
  const client = new Client(dbConfig);

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected");
    console.log("");

    if (!process.env.SKIP_CONFIRMATION) {
      console.log("⚠️  WARNING: This will DELETE ALL DATA in the database!");
      console.log(
        "⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue..."
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log("🗑️  Dropping schema public CASCADE...");
    await client.query("DROP SCHEMA IF EXISTS public CASCADE;");
    console.log("📦 Recreating schema public...");
    await client.query("CREATE SCHEMA public;");
    console.log("✅ Schema public reset complete");
  } finally {
    await client.end().catch(() => {});
  }
}

// 2) Миграции
function runMigrations() {
  console.log("");
  console.log("🚀 Running migrations...");
  console.log("=".repeat(50));

  execSync("npm run migration:run:prod", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("✅ Migrations applied successfully");
}

// 3) Сидинг (по флагу --seed)
function runSeed() {
  if (!shouldSeed) return;

  console.log("");
  console.log("🌱 Running seed script...");
  console.log("=".repeat(50));

  // Можешь поменять на seed-database.js, если нужно
  const seedScript = "seed-staging.js";

  execSync(`node scripts/${seedScript}`, {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("✅ Seed script completed successfully");
}

// Main
async function main() {
  try {
    await resetSchema();
    runMigrations();
    runSeed();

    console.log("");
    console.log("🎉 Database reset completed successfully!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("");
    console.error("❌ Database reset failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  });
}

module.exports = { main };
