/**
 * Fix All URLs to Use Only Real Working Images
 *
 * This script ensures ALL properties use ONLY the 5 verified working image URLs.
 * Any URL that is not in the verified list will be replaced.
 *
 * Usage:
 *   node backend/script/fix-all-urls-to-real-ones.js
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

// ONLY 5 verified working URLs - these are confirmed to work
const VERIFIED_URLS = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
];

/**
 * Check if URL is in verified list
 */
function isVerifiedUrl(url) {
  return VERIFIED_URLS.includes(url);
}

/**
 * Get random verified URL
 */
function getRandomVerifiedUrl() {
  return VERIFIED_URLS[Math.floor(Math.random() * VERIFIED_URLS.length)];
}

/**
 * Replace any non-verified URL with verified one
 */
function replaceWithVerified(url) {
  if (isVerifiedUrl(url)) {
    return url;
  }
  return getRandomVerifiedUrl();
}

async function fixAllUrls() {
  try {
    console.log("🚀 Fixing ALL URLs to use only verified working images...");
    console.log(`📍 Database: ${client.database} on ${client.host}:${client.port}`);
    console.log(`📸 Using ${VERIFIED_URLS.length} verified URLs only\n`);

    await client.connect();
    console.log("✅ Connected to database successfully!\n");

    // Fix URLs in property_media table
    console.log("📸 Fixing URLs in property_media table...");
    const mediaResult = await client.query(
      "SELECT id, property_id, url FROM property_media WHERE url LIKE '%unsplash%'"
    );

    let mediaFixed = 0;
    if (mediaResult.rows.length > 0) {
      console.log(`Found ${mediaResult.rows.length} media records\n`);

      for (const media of mediaResult.rows) {
        if (!isVerifiedUrl(media.url)) {
          const newUrl = getRandomVerifiedUrl();
          await client.query(
            "UPDATE property_media SET url = $1 WHERE id = $2",
            [newUrl, media.id]
          );
          mediaFixed++;
          console.log(`✅ Fixed media ${media.id}: replaced with verified URL`);
        }
      }
    }

    console.log(`\n📊 Fixed ${mediaFixed} media URL(s)\n`);

    // Fix URLs in properties.photos array
    console.log("📸 Fixing URLs in properties.photos array...");
    const propertiesResult = await client.query(
      "SELECT id, photos FROM properties WHERE photos IS NOT NULL AND array_length(photos, 1) > 0"
    );

    let propertiesFixed = 0;
    let totalPhotosFixed = 0;

    if (propertiesResult.rows.length > 0) {
      console.log(`Found ${propertiesResult.rows.length} properties with photos\n`);

      for (const property of propertiesResult.rows) {
        const fixedPhotos = property.photos.map(replaceWithVerified);
        const hasChanges = fixedPhotos.some(
          (url, index) => url !== property.photos[index]
        );

        if (hasChanges) {
          const changedCount = fixedPhotos.filter(
            (url, index) => url !== property.photos[index]
          ).length;

          await client.query(
            "UPDATE properties SET photos = $1::text[] WHERE id = $2",
            [fixedPhotos, property.id]
          );
          propertiesFixed++;
          totalPhotosFixed += changedCount;
          console.log(`✅ Fixed property ${property.id}: ${changedCount} photo(s) replaced`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Fixed ${mediaFixed} media URL(s)`);
    console.log(`✅ Fixed ${totalPhotosFixed} photo URL(s) in ${propertiesFixed} properties`);

    await client.end();
    console.log("\n🎉 All URLs fixed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    if (client._ending === false) {
      await client.end();
    }
    process.exit(1);
  }
}

// Run the script
fixAllUrls();

