import { DataSource } from "typeorm";
import { User } from "../src/entities/user.entity";
import { Property } from "../src/entities/property.entity";
import { PropertyMedia } from "../src/entities/property-media.entity";

// Database configuration
const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "rental_platform",
  entities: ["src/entities/*.entity.ts"],
  synchronize: false,
});

async function updatePropertyMedia() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    const propertyRepository = AppDataSource.getRepository(Property);
    const mediaRepository = AppDataSource.getRepository(PropertyMedia);

    // Find operator properties
    const properties = await propertyRepository.find({
      relations: ["operator"],
      where: {
        operator: {
          email: "operator@kingscross.com",
        },
      },
    });

    if (properties.length === 0) {
      console.log("❌ No properties found for operator");
      return;
    }

    // Clear existing media
    for (const property of properties) {
      await mediaRepository.delete({
        property: {
          id: property.id,
        },
      });
    }
    console.log("✅ Cleared existing media");

    // Add new media (3 images each)
    const mediaData = [];

    for (const property of properties) {
      let images = [];

      if (property.title.includes("Kings Cross Luxury")) {
        images = [
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
        ];
      } else if (property.title.includes("Camden Modern")) {
        images = [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
        ];
      } else if (property.title.includes("Regent")) {
        images = [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&h=600&fit=crop",
        ];
      }

      images.forEach((url, index) => {
        mediaData.push({
          property: property,
          url: url, // For testing, we'll use direct URLs instead of S3
          s3_key: `test-media/${property.id}-${index + 1}.jpg`, // Mock S3 key
          type: "image" as const,
          mime_type: "image/jpeg",
          original_filename: `${property.title.toLowerCase().replace(/\s+/g, "-")}-${index + 1}.jpg`,
          file_size: Math.floor(500000 + Math.random() * 100000),
          order_index: index,
          is_featured: index === 0,
        });
      });
    }

    // Save new media
    for (const mediaItem of mediaData) {
      const media = mediaRepository.create(mediaItem);
      await mediaRepository.save(media);
    }

    // Update properties with coordinates for map display
    for (const property of properties) {
      let lat = 51.5074; // Default London coordinates
      let lng = -0.1278;

      if (property.title.includes("Kings Cross")) {
        lat = 51.5308;
        lng = -0.1238;
      } else if (property.title.includes("Camden")) {
        lat = 51.539;
        lng = -0.1426;
      } else if (property.title.includes("Regent")) {
        lat = 51.5255;
        lng = -0.154;
      }

      await propertyRepository.update(property.id, {
        lat: lat,
        lng: lng,
      });
    }

    console.log("✅ Property media updated");
    console.log("✅ Property coordinates updated");
    console.log(`📸 Added ${mediaData.length} images total (3 per property)`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error("❌ Error updating media:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

// Run the update
updatePropertyMedia();
