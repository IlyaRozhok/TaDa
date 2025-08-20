import { DataSource } from "typeorm";
import { User, UserRole } from "../src/entities/user.entity";
import { OperatorProfile } from "../src/entities/operator-profile.entity";
import { Property } from "../src/entities/property.entity";
import { PropertyMedia } from "../src/entities/property-media.entity";
import * as bcrypt from "bcryptjs";

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

async function seedOperatorWithProperties() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    // Create operator user
    const userRepository = AppDataSource.getRepository(User);
    const operatorRepository = AppDataSource.getRepository(OperatorProfile);
    const propertyRepository = AppDataSource.getRepository(Property);
    const mediaRepository = AppDataSource.getRepository(PropertyMedia);

    // Hash password
    const hashedPassword = await bcrypt.hash("operator123", 10);

    // Create user
    const operator = userRepository.create({
      email: "operator@kingscross.com",
      password: hashedPassword,
      full_name: "King Cross Apartments",
      role: UserRole.Operator,
      email_verified: true,
    });

    const savedOperator = await userRepository.save(operator);
    console.log("✅ Operator user created:", savedOperator.email);

    // Create operator profile
    const operatorProfile = operatorRepository.create({
      user: savedOperator,
      full_name: "King Cross Apartments",
      company_name: "King Cross Property Management",
      license_number: "KCPM-2024-001",
      business_address: "37 Swinton Street, Camden, London, WC1X 9NT",
      business_description:
        "Premium property management company specializing in luxury apartments in Central London.",
      years_experience: 15,
      phone: "+44 20 7946 0958",
      operating_areas: ["Camden", "Kings Cross", "Central London"],
      property_types: ["Apartment", "Studio", "Penthouse"],
      services: ["Property Management", "Lettings", "Maintenance"],
    });

    await operatorRepository.save(operatorProfile);
    console.log("✅ Operator profile created");

    // Property 1: Kings Cross Luxury Apartment
    const property1 = propertyRepository.create({
      title: "Kings Cross Luxury Apartment",
      description:
        "Stunning modern apartment in the heart of Kings Cross with panoramic city views. Features high-end finishes, floor-to-ceiling windows, and access to premium building amenities including concierge, gym, and rooftop terrace.",
      address: "37 Swinton Street, Camden, London, WC1X 9NT",
      price: 1712,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "apartment",
      furnishing: "furnished",
      available_from: new Date("2024-02-01"),
      lifestyle_features: [
        "concierge_service",
        "gym_access",
        "rooftop_terrace",
        "high_speed_internet",
        "dishwasher",
        "washing_machine",
        "air_conditioning",
        "floor_to_ceiling_windows",
        "city_views",
        "premium_finishes",
      ],
      operator: savedOperator,
      is_btr: true,
    });

    const savedProperty1 = await propertyRepository.save(property1);
    console.log("✅ Property 1 created:", savedProperty1.title);

    // Property 2: Camden Modern Studio
    const property2 = propertyRepository.create({
      title: "Camden Modern Studio",
      description:
        "Beautifully designed studio apartment in trendy Camden. Perfect for young professionals with modern amenities, exposed brick walls, and excellent transport links to Central London.",
      address: "22 Brecknock Road, Camden, London, NW1 0AR",
      price: 1500,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnishing: "part-furnished",
      available_from: new Date("2024-02-15"),
      lifestyle_features: [
        "exposed_brick",
        "modern_kitchen",
        "excellent_transport",
        "trendy_location",
        "washing_machine",
        "high_speed_internet",
        "wooden_floors",
        "large_windows",
        "storage_space",
        "bike_storage",
      ],
      operator: savedOperator,
      is_btr: false,
    });

    const savedProperty2 = await propertyRepository.save(property2);
    console.log("✅ Property 2 created:", savedProperty2.title);

    // Property 3: Regent's Park Penthouse
    const property3 = propertyRepository.create({
      title: "Regent's Park Penthouse",
      description:
        "Exclusive penthouse apartment overlooking Regent's Park with private terrace, luxury finishes, and unparalleled views. Features include marble bathrooms, designer kitchen, and access to building spa and pool.",
      address: "15 Park Crescent, Regent's Park, London, W1B 1PH",
      price: 2800,
      bedrooms: 2,
      bathrooms: 2,
      property_type: "penthouse",
      furnishing: "furnished",
      available_from: new Date("2024-01-20"),
      lifestyle_features: [
        "private_terrace",
        "park_views",
        "marble_bathrooms",
        "designer_kitchen",
        "spa_access",
        "pool_access",
        "concierge_service",
        "luxury_finishes",
        "penthouse_level",
        "air_conditioning",
        "underfloor_heating",
        "wine_storage",
      ],
      operator: savedOperator,
      is_btr: true,
    });

    const savedProperty3 = await propertyRepository.save(property3);
    console.log("✅ Property 3 created:", savedProperty3.title);

    // Add sample media for properties (3 images each)
    const mediaData = [
      // Property 1: Kings Cross Luxury Apartment
      {
        property: savedProperty1,
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
        s3_key: "media/property1-main.jpg",
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "property1-main.jpg",
        file_size: 500000,
        order_index: 0,
        is_featured: true,
      },
      {
        property: savedProperty1,
        url: "https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&h=600&fit=crop",
        s3_key: "media/property1-2.jpg",
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "property1-2.jpg",
        file_size: 480000,
        order_index: 1,
        is_featured: false,
      },
      {
        property: savedProperty1,
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
        s3_key: "media/property1-3.jpg",
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "property1-3.jpg",
        file_size: 520000,
        order_index: 2,
        is_featured: false,
      },
      // Property 2: Camden Modern Studio
      {
        property: savedProperty2,
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
        s3_key: "media/property2-main.jpg",
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "property2-main.jpg",
        file_size: 520000,
        order_index: 0,
        is_featured: true,
      },
      {
        property: savedProperty2,
        url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
        s3_key: "media/property2-2.jpg",
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "property2-2.jpg",
        file_size: 490000,
        order_index: 1,
        is_featured: false,
      },
      {
        property: savedProperty2,
        url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
        s3_key: "media/property2-3.jpg",
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "property2-3.jpg",
        file_size: 505000,
        order_index: 2,
        is_featured: false,
      },
      // Property 3: Regent's Park Penthouse
      {
        property: savedProperty3,
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
        s3_key: "media/property3-main.jpg",
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "property3-main.jpg",
        file_size: 550000,
        order_index: 0,
        is_featured: true,
      },
      {
        property: savedProperty3,
        url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
        s3_key: "media/property3-2.jpg",
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "property3-2.jpg",
        file_size: 510000,
        order_index: 1,
        is_featured: false,
      },
      {
        property: savedProperty3,
        url: "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&h=600&fit=crop",
        s3_key: "media/property3-3.jpg",
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "property3-3.jpg",
        file_size: 530000,
        order_index: 2,
        is_featured: false,
      },
    ];

    for (const mediaItem of mediaData) {
      const media = mediaRepository.create(mediaItem);
      await mediaRepository.save(media);
    }

    console.log("✅ Property media added");

    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📋 Operator Account Details:");
    console.log("Email: operator@kingscross.com");
    console.log("Password: operator123");
    console.log("Role: operator");
    console.log("\n🏠 Properties Created:");
    console.log("1. Kings Cross Luxury Apartment - £1,712/month");
    console.log("2. Camden Modern Studio - £1,500/month");
    console.log("3. Regent's Park Penthouse - £2,800/month");

    await AppDataSource.destroy();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

// Run the seeding
seedOperatorWithProperties();
