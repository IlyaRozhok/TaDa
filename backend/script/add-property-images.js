/**
 * Property Images Seeder
 *
 * This script adds random apartment images to all properties in the database.
 * For each property without existing images, it will:
 * - Add 2-5 random images to the property_media table
 * - Update the photos array in the properties table
 *
 * Usage:
 *   node backend/script/add-property-images.js
 *
 * The script will:
 * - Skip properties that already have images
 * - Use random apartment images from Unsplash
 * - Connect to the database using environment variables from .env file
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

// Array of random apartment image URLs
// Using direct Unsplash image URLs - these are stable and work when copied
// Format: https://images.unsplash.com/photo-{photo-id}?w=1200
const APARTMENT_IMAGES = [
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
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200",
  "https://images.unsplash.com/photo-1600210491892-03d54cdfa423?w=1200",
  "https://images.unsplash.com/photo-1600210491892-03d54cdfa423?w=1200",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200",
  "https://images.unsplash.com/photo-1600210491892-03d54cdfa423?w=1200",
];

/**
 * Get random images from the array
 */
function getRandomImages(count = 3) {
  const shuffled = [...APARTMENT_IMAGES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function addImagesToProperties() {
  try {
    console.log("🚀 Starting property images seeder...");
    console.log(
      `📍 Database: ${client.database} on ${client.host}:${client.port}`
    );
    console.log(`👤 User: ${client.user}`);

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

    console.log(`📊 Found ${propertiesResult.rows.length} properties`);

    let successCount = 0;
    let errorCount = 0;

    // Process each property
    for (const property of propertiesResult.rows) {
      try {
        // Check if property already has media
        const existingMediaResult = await client.query(
          "SELECT COUNT(*) as count FROM property_media WHERE property_id = $1",
          [property.id]
        );

        const existingCount = parseInt(existingMediaResult.rows[0].count);

        if (existingCount > 0) {
          console.log(
            `⏭️  Property "${property.title}" (${property.id}) already has ${existingCount} image(s). Skipping...`
          );
          continue;
        }

        // Get random number of images (2-5 per property)
        const imageCount = randomInt(2, 5);
        const images = getRandomImages(imageCount);

        console.log(
          `📸 Adding ${imageCount} image(s) to property "${property.title}" (${property.id})...`
        );

        // Insert images into property_media table
        for (let i = 0; i < images.length; i++) {
          const imageUrl = images[i];
          const filename = imageUrl.split("/").pop() || `image-${i + 1}.jpg`;
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
              randomInt(500000, 2000000), // Random file size between 500KB and 2MB
              i, // order_index
            ]
          );
        }

        // Also update the photos array in properties table
        await client.query("UPDATE properties SET photos = $1 WHERE id = $2", [
          images,
          property.id,
        ]);

        successCount++;
        console.log(
          `✅ Successfully added ${imageCount} image(s) to property "${property.title}"`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Error adding images to property "${property.title}" (${property.id}):`,
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
    console.log("🎉 Image seeding completed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    if (client._ending === false) {
      await client.end();
    }
    process.exit(1);
  }
}

// Run the script
addImagesToProperties();
