/**
 * Update Property Image URLs Script
 * 
 * This script updates existing image URLs in property_media table
 * to use simpler, more stable URL format
 * 
 * Usage:
 *   node backend/script/update-property-image-urls.js
 */

const { Client } = require("pg");
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

// Simple URL format - just width parameter
function simplifyUrl(url) {
  if (!url || typeof url !== "string") return url;
  
  // Extract photo ID from Unsplash URL
  const match = url.match(/photo-(\d+)/);
  if (match) {
    const photoId = match[1];
    return `https://images.unsplash.com/photo-${photoId}?w=1200`;
  }
  
  return url;
}

async function updateImageUrls() {
  try {
    console.log("🚀 Starting property image URLs update...");
    console.log(
      `📍 Database: ${client.database} on ${client.host}:${client.port}`
    );
    console.log(`👤 User: ${client.user}`);

    await client.connect();
    console.log("✅ Connected to database successfully!");

    // Get all property_media records
    const mediaResult = await client.query(
      "SELECT id, property_id, url FROM property_media WHERE url LIKE '%unsplash%' ORDER BY created_at"
    );

    if (mediaResult.rows.length === 0) {
      console.log("⚠️  No Unsplash images found in database. Exiting.");
      await client.end();
      return;
    }

    console.log(`📊 Found ${mediaResult.rows.length} image(s) to update`);

    let successCount = 0;
    let errorCount = 0;

    // Process each media record
    for (const media of mediaResult.rows) {
      try {
        const simplifiedUrl = simplifyUrl(media.url);
        
        if (simplifiedUrl === media.url) {
          console.log(
            `⏭️  Media ${media.id} already has simple URL. Skipping...`
          );
          continue;
        }

        console.log(`🔄 Updating media ${media.id}...`);
        console.log(`   Old: ${media.url}`);
        console.log(`   New: ${simplifiedUrl}`);

        await client.query("UPDATE property_media SET url = $1 WHERE id = $2", [
          simplifiedUrl,
          media.id,
        ]);

        successCount++;
        console.log(`✅ Successfully updated media ${media.id}`);
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Error updating media ${media.id}:`,
          error.message
        );
      }
    }

    // Also update photos array in properties table
    console.log("\n🔄 Updating photos arrays in properties table...");
    const propertiesResult = await client.query(
      "SELECT id, photos FROM properties WHERE photos IS NOT NULL AND array_length(photos, 1) > 0"
    );

    let propertiesUpdated = 0;
    for (const property of propertiesResult.rows) {
      try {
        const updatedPhotos = property.photos.map((url) => simplifyUrl(url));
        const hasChanges = updatedPhotos.some(
          (url, index) => url !== property.photos[index]
        );

        if (hasChanges) {
          await client.query("UPDATE properties SET photos = $1 WHERE id = $2", [
            updatedPhotos,
            property.id,
          ]);
          propertiesUpdated++;
        }
      } catch (error) {
        console.error(
          `❌ Error updating property ${property.id}:`,
          error.message
        );
      }
    }

    console.log("\n📊 Summary:");
    console.log(`✅ Successfully updated: ${successCount} media records`);
    console.log(`✅ Successfully updated: ${propertiesUpdated} properties`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} records`);
    }

    await client.end();
    console.log("🎉 URL update completed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    if (client._ending === false) {
      await client.end();
    }
    process.exit(1);
  }
}

// Run the script
updateImageUrls();



