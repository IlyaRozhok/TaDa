const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file if it exists
try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch (e) {
  console.log("⚠️  dotenv not found or .env file missing, using defaults");
}

const client = new Client({
  host: process.env.DB_HOST || "95.217.7.37",
  user: process.env.DB_USER || "tada_user",
  password:
    process.env.DB_PASSWORD || "Z2e6bz3Ppd7AwEvuqXBrnkJVDaWRGTK8m4USjyYQ",
  database: process.env.DB_NAME || "tada_dev",
  port: parseInt(process.env.DB_PORT) || 5433,
});

console.log("🚀 Starting test properties seeder...");
console.log(`📍 Database: ${client.database} on ${client.host}:${client.port}`);
console.log(`👤 User: ${client.user}`);

client.connect((err) => {
  if (err) {
    console.error("❌ Connection error:", err.message);
    process.exit(1);
  }

  console.log("✅ Connected to database successfully!");

  const sqlFilePath = path.join(__dirname, "..", "test-properties.sql");
  console.log("📖 Reading SQL file from:", sqlFilePath);

  try {
    const sql = fs.readFileSync(sqlFilePath, "utf8");
    console.log("📄 SQL file loaded successfully");

    // Execute SQL with promise-based approach for better error handling
    client
      .query(sql)
      .then((res) => {
        console.log("✅ Properties inserted successfully!");
        console.log(`📊 Rows affected: ${res.rowCount || "N/A"}`);
        client.end();
        console.log("🎉 Seeding completed!");
      })
      .catch((queryErr) => {
        console.error("❌ Query error:", queryErr.message);
        console.error("🔍 Error details:", queryErr);
        client.end();
        process.exit(1);
      });
  } catch (readErr) {
    console.error("❌ File read error:", readErr.message);
    client.end();
    process.exit(1);
  }
});
