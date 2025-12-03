/**
 * Check and Fix Broken Image URLs Script
 *
 * This script checks which image URLs are broken and replaces them with working ones.
 *
 * Usage:
 *   node backend/script/check-broken-images.js
 */

const { Client } = require("pg");
const https = require("https");
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

// Valid working Unsplash URLs
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

function getRandomValidUrl() {
  return VALID_UNSPLASH_URLS[
    Math.floor(Math.random() * VALID_UNSPLASH_URLS.length)
  ];
}

/**
 * Check if URL is accessible (returns 200)
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: "HEAD",
      timeout: 5000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);
    });

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function checkAndFixBrokenImages() {
  try {
    console.log("🚀 Starting broken image URLs check...");
    console.log(
      `📍 Database: ${client.database} on ${client.host}:${client.port}`
    );

    await client.connect();
    console.log("✅ Connected to database successfully!");

    // Check URLs in property_media table
    console.log("\n📸 Checking URLs in property_media table...");
    const mediaResult = await client.query(
      "SELECT id, property_id, url FROM property_media WHERE url LIKE '%unsplash%'"
    );

    if (mediaResult.rows.length === 0) {
      console.log("⚠️  No Unsplash images found in property_media table.");
    } else {
      console.log(`📊 Found ${mediaResult.rows.length} image(s) to check`);

      let brokenCount = 0;
      let fixedCount = 0;

      for (const media of mediaResult.rows) {
        const isWorking = await checkUrl(media.url);
        
        if (!isWorking) {
          console.log(`❌ Broken URL found: ${media.url.substring(0, 80)}...`);
          brokenCount++;
          
          const newUrl = getRandomValidUrl();
          await client.query(
            "UPDATE property_media SET url = $1 WHERE id = $2",
            [newUrl, media.id]
          );
          fixedCount++;
          console.log(`   ✅ Fixed with: ${newUrl.substring(0, 80)}...`);
        }
      }

      console.log(`\n📊 Results:`);
      console.log(`❌ Broken URLs: ${brokenCount}`);
      console.log(`✅ Fixed URLs: ${fixedCount}`);
    }

    // Check URLs in properties.photos array
    console.log("\n📸 Checking URLs in properties.photos array...");
    const propertiesResult = await client.query(
      "SELECT id, photos FROM properties WHERE photos IS NOT NULL AND array_length(photos, 1) > 0"
    );

    if (propertiesResult.rows.length === 0) {
      console.log("⚠️  No properties with photos found.");
    } else {
      console.log(`📊 Found ${propertiesResult.rows.length} properties with photos`);

      let propertiesFixed = 0;
      let totalPhotosFixed = 0;

      for (const property of propertiesResult.rows) {
        const fixedPhotos = [];
        let hasChanges = false;

        for (const url of property.photos) {
          if (!url || !url.includes("unsplash.com")) {
            fixedPhotos.push(url);
            continue;
          }

          const isWorking = await checkUrl(url);
          
          if (!isWorking) {
            console.log(`❌ Broken URL in property ${property.id}: ${url.substring(0, 80)}...`);
            fixedPhotos.push(getRandomValidUrl());
            hasChanges = true;
            totalPhotosFixed++;
          } else {
            fixedPhotos.push(url);
          }
        }

        if (hasChanges) {
          await client.query(
            "UPDATE properties SET photos = $1 WHERE id = $2",
            [fixedPhotos, property.id]
          );
          propertiesFixed++;
        }
      }

      console.log(`\n📊 Results:`);
      console.log(`✅ Fixed ${totalPhotosFixed} photo URL(s) in ${propertiesFixed} properties`);
    }

    await client.end();
    console.log("\n🎉 Broken image check completed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    if (client._ending === false) {
      await client.end();
    }
    process.exit(1);
  }
}

// Run the script
checkAndFixBrokenImages();

