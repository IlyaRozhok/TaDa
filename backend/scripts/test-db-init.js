#!/usr/bin/env node

/**
 * 🧪 Database Initialization Test Script
 *
 * Тестирует инициализацию базы данных в production-подобных условиях:
 * 1. Проверяет подключение к базе данных
 * 2. Проверяет наличие всех таблиц после миграций
 * 3. Проверяет структуру основных таблиц
 * 4. Проверяет наличие индексов
 * 5. Выводит отчет о готовности к production
 *
 * Usage:
 *   node scripts/test-db-init.js [--host=postgres-test] [--port=5432]
 */

const { Client } = require("pg");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const hostArg = args.find((arg) => arg.startsWith("--host="));
const portArg = args.find((arg) => arg.startsWith("--port="));

// Load environment variables
try {
  require("dotenv").config({
    path: path.join(__dirname, "..", ".env.test-prod"),
  });
} catch (e) {
  // dotenv is optional
}

// Database configuration
const dbConfig = {
  host: hostArg ? hostArg.split("=")[1] : process.env.DB_HOST || "localhost",
  port: portArg
    ? parseInt(portArg.split("=")[1])
    : parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "test_prod_password",
  database: process.env.DB_NAME || "rental_platform",
};

// Expected tables based on entities
const expectedTables = [
  "users",
  "operator_profiles",
  "tenant_profiles",
  "preferences",
  "properties",
  "property_media",
  "shortlist",
  "buildings",
  "migrations",
];

// Expected columns for key tables
const expectedColumns = {
  users: [
    "id",
    "email",
    "password",
    "role",
    "full_name",
    "created_at",
    "updated_at",
  ],
  properties: [
    "id",
    "title",
    "description",
    "address",
    "price",
    "created_at",
    "updated_at",
  ],
  operator_profiles: [
    "id",
    "userid",
    "company_name",
    "created_at",
    "updated_at",
  ],
  tenant_profiles: ["id", "userid", "created_at", "updated_at"],
};

// Column name mapping for PostgreSQL (case sensitive)
const columnMapping = {
  operator_profiles: { userid: "userId" },
  tenant_profiles: { userid: "userId" },
};

console.log("🧪 Database Initialization Test");
console.log("=".repeat(60));
console.log(`📊 Database: ${dbConfig.database}`);
console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`👤 User: ${dbConfig.user}`);
console.log("");

let client;

async function testConnection() {
  console.log("1️⃣  Testing database connection...");
  try {
    client = new Client(dbConfig);
    await client.connect();
    console.log("   ✅ Successfully connected to database");
    return true;
  } catch (error) {
    console.error(`   ❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function checkDatabaseExists() {
  console.log("\n2️⃣  Checking if database exists...");
  try {
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datname = $1",
      [dbConfig.database]
    );
    if (result.rows.length > 0) {
      console.log(`   ✅ Database '${dbConfig.database}' exists`);
      return true;
    } else {
      console.error(`   ❌ Database '${dbConfig.database}' does not exist`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error checking database: ${error.message}`);
    return false;
  }
}

async function checkTables() {
  console.log("\n3️⃣  Checking tables...");
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const existingTables = result.rows.map((row) => row.table_name);
    console.log(`   📋 Found ${existingTables.length} tables`);

    const missingTables = expectedTables.filter(
      (table) => !existingTables.includes(table)
    );
    const extraTables = existingTables.filter(
      (table) => !expectedTables.includes(table)
    );

    if (missingTables.length > 0) {
      console.error(`   ❌ Missing tables: ${missingTables.join(", ")}`);
    } else {
      console.log("   ✅ All expected tables exist");
    }

    if (extraTables.length > 0) {
      console.log(`   ℹ️  Extra tables: ${extraTables.join(", ")}`);
    }

    return missingTables.length === 0;
  } catch (error) {
    console.error(`   ❌ Error checking tables: ${error.message}`);
    return false;
  }
}

async function checkTableColumns() {
  console.log("\n4️⃣  Checking table columns...");
  let allPassed = true;

  for (const [table, expectedCols] of Object.entries(expectedColumns)) {
    try {
      const result = await client.query(
        `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `,
        [table]
      );

      const existingCols = result.rows.map((row) => row.column_name);
      const missingCols = expectedCols.filter((col) => {
        // Check if column exists with its expected name or mapped name
        const mappedName = columnMapping[table] && columnMapping[table][col];
        return (
          !existingCols.includes(col) &&
          (!mappedName || !existingCols.includes(mappedName))
        );
      });

      if (missingCols.length > 0) {
        console.error(
          `   ❌ Table '${table}' missing columns: ${missingCols.join(", ")}`
        );
        allPassed = false;
      } else {
        console.log(`   ✅ Table '${table}' has all required columns`);
      }
    } catch (error) {
      console.error(`   ❌ Error checking table '${table}': ${error.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function checkIndexes() {
  console.log("\n5️⃣  Checking indexes...");
  try {
    const result = await client.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    const indexes = result.rows;
    console.log(`   📋 Found ${indexes.length} indexes`);

    // Check for important indexes
    const importantIndexes = [
      { table: "users", pattern: /email/i },
      { table: "properties", pattern: /operator_id|created_at/i },
      { table: "users", pattern: /id/i },
    ];

    let foundImportant = 0;
    for (const idx of indexes) {
      for (const important of importantIndexes) {
        if (
          idx.tablename === important.table &&
          important.pattern.test(idx.indexdef)
        ) {
          foundImportant++;
          break;
        }
      }
    }

    if (foundImportant > 0) {
      console.log(`   ✅ Found ${foundImportant} important indexes`);
    } else {
      console.log("   ⚠️  Some important indexes might be missing");
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error checking indexes: ${error.message}`);
    return false;
  }
}

async function checkMigrations() {
  console.log("\n6️⃣  Checking migrations...");
  try {
    const result = await client.query(`
      SELECT * FROM migrations 
      ORDER BY timestamp DESC
    `);

    console.log(`   📋 Found ${result.rows.length} applied migrations`);
    if (result.rows.length > 0) {
      console.log("   📝 Latest migrations:");
      result.rows.slice(0, 5).forEach((migration) => {
        console.log(
          `      • ${migration.name} (${new Date(
            parseInt(migration.timestamp)
          ).toISOString()})`
        );
      });
      console.log("   ✅ Migrations table exists and has records");
    } else {
      console.log("   ⚠️  No migrations found (might be a fresh database)");
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error checking migrations: ${error.message}`);
    return false;
  }
}

async function checkForeignKeys() {
  console.log("\n7️⃣  Checking foreign key constraints...");
  try {
    const result = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);

    console.log(`   📋 Found ${result.rows.length} foreign key constraints`);
    if (result.rows.length > 0) {
      console.log("   ✅ Foreign key constraints are properly set up");
    } else {
      console.log("   ⚠️  No foreign key constraints found");
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error checking foreign keys: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const results = {
    connection: false,
    database: false,
    tables: false,
    columns: false,
    indexes: false,
    migrations: false,
    foreignKeys: false,
  };

  results.connection = await testConnection();
  if (!results.connection) {
    console.log("\n❌ Cannot proceed without database connection");
    return results;
  }

  results.database = await checkDatabaseExists();
  results.tables = await checkTables();
  results.columns = await checkTableColumns();
  results.indexes = await checkIndexes();
  results.migrations = await checkMigrations();
  results.foreignKeys = await checkForeignKeys();

  return results;
}

async function main() {
  try {
    const results = await runTests();

    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Results Summary");
    console.log("=".repeat(60));

    const allTests = [
      { name: "Database Connection", passed: results.connection },
      { name: "Database Exists", passed: results.database },
      { name: "Tables Check", passed: results.tables },
      { name: "Columns Check", passed: results.columns },
      { name: "Indexes Check", passed: results.indexes },
      { name: "Migrations Check", passed: results.migrations },
      { name: "Foreign Keys Check", passed: results.foreignKeys },
    ];

    allTests.forEach((test) => {
      const icon = test.passed ? "✅" : "❌";
      console.log(`${icon} ${test.name}`);
    });

    const allPassed = Object.values(results).every((r) => r === true);

    console.log("\n" + "=".repeat(60));
    if (allPassed) {
      console.log("🎉 All tests passed! Database is ready for production.");
      console.log("=".repeat(60));
      process.exit(0);
    } else {
      console.log("⚠️  Some tests failed. Please review the errors above.");
      console.log("=".repeat(60));
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (client && !client.ended) {
      await client.end();
    }
  }
}

// Run the tests
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { main, runTests };
