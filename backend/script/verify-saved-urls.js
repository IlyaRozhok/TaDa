/**
 * Verify Saved Image URLs Script
 *
 * Checks that URLs in database are saved correctly and not truncated.
 *
 * Usage:
 *   node backend/script/verify-saved-urls.js
 */

const { Client } = require("pg");
const path = require("path");

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

async function verifySavedUrls() {
  try {
    await client.connect();
    console.log("✅ Connected to database successfully!\n");

    // Check URLs in property_media table
    console.log("📸 Checking URLs in property_media table...");
    const mediaResult = await client.query(
      "SELECT id, property_id, url FROM property_media WHERE url LIKE '%unsplash%' LIMIT 10"
    );

    console.log(`Found ${mediaResult.rows.length} sample records:\n`);
    mediaResult.rows.forEach((media, idx) => {
      console.log(`${idx + 1}. Media ID: ${media.id}`);
      console.log(`   URL length: ${media.url?.length || 0} chars`);
      console.log(`   URL: ${media.url}`);
      console.log(`   Full URL check: ${media.url?.includes('w=1200') ? '✅ Has w=1200' : '❌ Missing w=1200'}`);
      console.log(`   Complete check: ${media.url?.match(/photo-\d+-\w+\?w=\d+/) ? '✅ Complete' : '❌ Incomplete'}`);
      console.log();
    });

    // Check URLs in properties.photos array
    console.log("\n📸 Checking URLs in properties.photos array...");
    const propertiesResult = await client.query(
      "SELECT id, photos FROM properties WHERE photos IS NOT NULL AND array_length(photos, 1) > 0 LIMIT 5"
    );

    console.log(`Found ${propertiesResult.rows.length} sample properties:\n`);
    propertiesResult.rows.forEach((property, idx) => {
      console.log(`${idx + 1}. Property ID: ${property.id}`);
      console.log(`   Photos count: ${property.photos?.length || 0}`);
      if (property.photos && property.photos.length > 0) {
        property.photos.forEach((url, photoIdx) => {
          console.log(`   Photo ${photoIdx + 1}:`);
          console.log(`     Length: ${url?.length || 0} chars`);
          console.log(`     URL: ${url}`);
          console.log(`     Complete: ${url?.match(/photo-\d+-\w+\?w=\d+/) ? '✅' : '❌'}`);
        });
      }
      console.log();
    });

    await client.end();
    console.log("🎉 Verification completed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    if (client._ending === false) {
      await client.end();
    }
    process.exit(1);
  }
}

verifySavedUrls();



