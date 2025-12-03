/**
 * Fix Property Image URLs Script
 *
 * This script fixes incomplete Unsplash URLs in the database.
 * Problem: URLs like "photo-1560185127?w=1200" are missing the full ID.
 * Solution: Replace with complete URLs that include full photo IDs.
 *
 * Usage:
 *   node backend/script/fix-property-image-urls.js
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

// Complete valid Unsplash URLs with full photo IDs
const VALID_UNSPLASH_URLS = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
  "https://images.unsplash.com/photo-1486304873000-235643847519?w=1200",
  "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=1200",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
  "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200",
  "https://images.unsplash.com/photo-1600585154084-4e5f7d2c93a0?w=1200",
  "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200",
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200",
  "https://images.unsplash.com/photo-1560449752-8802ae8b585d?w=1200",
  "https://images.unsplash.com/photo-1600607688969-a5bcdc6a8f5c?w=1200",
  "https://images.unsplash.com/photo-1600566752373-3e7c3e8f5f9b?w=1200",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200",
  "https://images.unsplash.com/photo-1600210491892-03d54cdfa423?w=1200",
];

/**
 * Get a random valid URL to replace broken ones
 */
function getRandomValidUrl() {
  return VALID_UNSPLASH_URLS[
    Math.floor(Math.random() * VALID_UNSPLASH_URLS.length)
  ];
}

/**
 * Check if URL is valid (has complete photo ID)
 */
function isValidUrl(url) {
  if (!url || typeof url !== "string") return false;

  // Check if URL has complete photo ID (format: photo-{numbers}-{hex})
  const match = url.match(/photo-\d+-[a-f0-9]{12,}/);
  return match !== null;
}

/**
 * Fix URL - if invalid, replace with random valid one
 */
function fixUrl(url) {
  if (!url || typeof url !== "string") return getRandomValidUrl();

  if (isValidUrl(url)) {
    return url; // Already valid
  }

  // Replace invalid URL with random valid one
  return getRandomValidUrl();
}

async function fixImageUrls() {
  try {
    console.log("🚀 Starting property image URLs fix...");
    console.log(
      `📍 Database: ${client.database} on ${client.host}:${client.port}`
    );
    console.log(`👤 User: ${client.user}`);

    await client.connect();
    console.log("✅ Connected to database successfully!");

    // Fix URLs in property_media table
    console.log("\n📸 Fixing URLs in property_media table...");
    const mediaResult = await client.query(
      "SELECT id, property_id, url FROM property_media WHERE url LIKE '%unsplash%' ORDER BY created_at"
    );

    if (mediaResult.rows.length === 0) {
      console.log("⚠️  No Unsplash images found in property_media table.");
    } else {
      console.log(
        `📊 Found ${mediaResult.rows.length} image(s) in property_media`
      );

      let fixedCount = 0;
      for (const media of mediaResult.rows) {
        console.log(`\n   Checking media ${media.id}:`);
        console.log(`   Current URL: ${media.url}`);
        console.log(`   URL length: ${media.url?.length || 0}`);
        console.log(`   Is valid: ${isValidUrl(media.url)}`);

        const fixedUrl = fixUrl(media.url);
        if (fixedUrl !== media.url) {
          console.log(`   ✅ Will fix to: ${fixedUrl}`);
          await client.query(
            "UPDATE property_media SET url = $1 WHERE id = $2",
            [fixedUrl, media.id]
          );
          fixedCount++;
        } else {
          console.log(`   ⏭️  URL is already valid, skipping`);
        }
      }
      console.log(`\n✅ Fixed ${fixedCount} URL(s) in property_media table`);
    }

    // Fix URLs in properties.photos array
    console.log("\n📸 Fixing URLs in properties.photos array...");
    const propertiesResult = await client.query(
      "SELECT id, photos FROM properties WHERE photos IS NOT NULL AND array_length(photos, 1) > 0"
    );

    if (propertiesResult.rows.length === 0) {
      console.log("⚠️  No properties with photos found.");
    } else {
      console.log(
        `📊 Found ${propertiesResult.rows.length} properties with photos`
      );

      let propertiesFixed = 0;
      let totalPhotosFixed = 0;

      for (const property of propertiesResult.rows) {
        console.log(`\n   Checking property ${property.id}:`);
        console.log(`   Current photos: ${property.photos.length} photo(s)`);
        property.photos.forEach((url, idx) => {
          console.log(
            `     Photo ${idx + 1}: ${url?.substring(0, 80)}... (length: ${
              url?.length || 0
            }, valid: ${isValidUrl(url)})`
          );
        });

        const fixedPhotos = property.photos.map((url) => fixUrl(url));
        const hasChanges = fixedPhotos.some(
          (url, index) => url !== property.photos[index]
        );

        if (hasChanges) {
          const changedCount = fixedPhotos.filter(
            (url, index) => url !== property.photos[index]
          ).length;

          console.log(`   ✅ Will fix ${changedCount} photo(s)`);
          fixedPhotos.forEach((url, idx) => {
            if (url !== property.photos[idx]) {
              console.log(
                `     Fixed photo ${idx + 1}: ${url.substring(0, 80)}...`
              );
            }
          });

          await client.query(
            "UPDATE properties SET photos = $1 WHERE id = $2",
            [fixedPhotos, property.id]
          );
          propertiesFixed++;
          totalPhotosFixed += changedCount;
        } else {
          console.log(`   ⏭️  All photos are valid, skipping`);
        }
      }

      console.log(
        `✅ Fixed ${totalPhotosFixed} photo URL(s) in ${propertiesFixed} properties`
      );
    }

    await client.end();
    console.log("\n🎉 URL fixing completed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    if (client._ending === false) {
      await client.end();
    }
    process.exit(1);
  }
}

// Run the script
fixImageUrls();
