/**
 * Refresh All Property Images Script (Real Working URLs Only)
 *
 * Uses only 5-6 verified working apartment images to avoid broken URLs.
 *
 * Usage:
 *   node backend/script/refresh-with-real-images.js
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

// ONLY 5 verified working apartment images - tested and confirmed working
// Simple format to avoid any truncation: https://images.unsplash.com/photo-{id}-{hash}?w=1200
const REAL_WORKING_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
];

/**
 * Get random images from the small pool (reusing is fine)
 */
function getRandomImages(count = 3) {
  const images = [];
  for (let i = 0; i < count; i++) {
    images.push(REAL_WORKING_IMAGES[i % REAL_WORKING_IMAGES.length]);
  }
  // Shuffle to avoid always using same order
  return images.sort(() => 0.5 - Math.random());
}

/**
 * Get random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function refreshAllImages() {
  try {
    console.log("🚀 Starting property images refresh with REAL working URLs...");
    console.log(`📍 Database: ${client.database} on ${client.host}:${client.port}`);
    console.log(`👤 User: ${client.user}`);
    console.log(`📸 Using ${REAL_WORKING_IMAGES.length} verified working images`);

    await client.connect();
    console.log("✅ Connected to database successfully!");

    // Get all properties
    const propertiesResult = await client.query(
      "SELECT id, title FROM properties ORDER BY created_at"
    );

    if (propertiesResult.rows.length === 0) {
      console.log("⚠️  No properties found in database. Exiting.");
      await client.end();
      return;
    }

    console.log(`📊 Found ${propertiesResult.rows.length} properties\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process each property
    for (const property of propertiesResult.rows) {
      try {
        // Get random number of images (2-5 per property)
        const imageCount = randomInt(2, 5);
        const images = getRandomImages(imageCount);

        // Verify URLs are not too long (PostgreSQL text array might have limits)
        images.forEach((url, idx) => {
          if (url.length > 200) {
            console.warn(`⚠️  URL ${idx + 1} for property ${property.id} is very long: ${url.length} chars`);
          }
        });

        // Delete all existing media for this property
        await client.query(
          "DELETE FROM property_media WHERE property_id = $1",
          [property.id]
        );

        // Insert new images into property_media table
        for (let i = 0; i < images.length; i++) {
          const imageUrl = images[i];
          const filename = `image-${i + 1}.jpg`;
          const s3Key = `property-media/${property.id}/${filename}`;

          await client.query(
            `INSERT INTO property_media (
              id, property_id, url, s3_key, type, mime_type, original_filename, file_size, order_index, created_at, updated_at
            ) VALUES (
              uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
            )`,
            [
              property.id,
              imageUrl,
              s3Key,
              "image",
              "image/jpeg",
              filename,
              randomInt(500000, 2000000),
              i,
            ]
          );
        }

        // Update the photos array in properties table
        // Using explicit array casting to avoid truncation
        await client.query(
          "UPDATE properties SET photos = $1::text[] WHERE id = $2",
          [images, property.id]
        );

        // Verify what was saved
        const verifyResult = await client.query(
          "SELECT photos FROM properties WHERE id = $1",
          [property.id]
        );
        const savedPhotos = verifyResult.rows[0]?.photos || [];
        
        // Check if URLs were truncated
        let truncated = false;
        images.forEach((originalUrl, idx) => {
          const savedUrl = savedPhotos[idx];
          if (savedUrl && savedUrl !== originalUrl) {
            console.warn(`⚠️  URL truncated for property ${property.id}:`);
            console.warn(`   Original: ${originalUrl}`);
            console.warn(`   Saved: ${savedUrl}`);
            truncated = true;
          }
        });

        if (!truncated) {
          successCount++;
          console.log(`✅ Property "${property.title}": ${imageCount} images saved correctly`);
        } else {
          errorCount++;
          console.error(`❌ Property "${property.title}": URLs were truncated!`);
        }
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Error refreshing images for property "${property.title}" (${property.id}):`,
          error.message
        );
      }
    }

    console.log("\n📊 Summary:");
    console.log(`✅ Successfully processed: ${successCount} properties`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} properties`);
    }

    await client.end();
    console.log("\n🎉 Image refresh completed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    if (client._ending === false) {
      await client.end();
    }
    process.exit(1);
  }
}

// Run the script
refreshAllImages();

