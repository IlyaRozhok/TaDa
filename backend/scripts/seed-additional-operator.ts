import { DataSource } from "typeorm";
import { User } from "../src/entities/user.entity";
import { OperatorProfile } from "../src/entities/operator-profile.entity";
import { Property } from "../src/entities/property.entity";
import { PropertyMedia } from "../src/entities/property-media.entity";
import { UserRole } from "../src/entities/user.entity";
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

async function seedAdditionalOperator() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    const userRepository = AppDataSource.getRepository(User);
    const operatorRepository = AppDataSource.getRepository(OperatorProfile);
    const propertyRepository = AppDataSource.getRepository(Property);
    const mediaRepository = AppDataSource.getRepository(PropertyMedia);

    // Check if operator already exists
    const existingUser = await userRepository.findOne({
      where: { email: "operator2@shoreditch.com" },
    });

    if (existingUser) {
      console.log("✅ Additional operator already exists");
      await AppDataSource.destroy();
      return;
    }

    // Create operator user
    const hashedPassword = await bcrypt.hash("operator123", 10);
    const operatorUser = userRepository.create({
      email: "operator2@shoreditch.com",
      password: hashedPassword,
      role: UserRole.Operator,
      full_name: "Shoreditch Properties Ltd",
      email_verified: true,
    });

    const savedUser = await userRepository.save(operatorUser);
    console.log("✅ Additional operator user created:", savedUser.email);

    // Create operator profile
    const operatorProfile = operatorRepository.create({
      user: savedUser,
      company_name: "Shoreditch Properties Ltd",
      business_description:
        "Premium properties in East London's creative quarter",
      license_number: "SH789456",
      business_address: "45 Old Street, Shoreditch, London EC1V 9HX",
      years_experience: 8,
      phone: "+44 20 7946 0987",
      operating_areas: ["Shoreditch", "Hoxton", "Old Street", "Spitalfields"],
      property_types: ["apartment", "loft", "studio"],
      services: ["property_management", "tenant_relations", "maintenance"],
    });

    await operatorRepository.save(operatorProfile);
    console.log("✅ Additional operator profile created");

    // Create properties
    const property1 = propertyRepository.create({
      title: "Shoreditch Loft Studio",
      description:
        "Contemporary loft-style studio apartment in the heart of Shoreditch's creative district. Features exposed brick walls, high ceilings, and industrial design elements. Perfect for young professionals and creatives.",
      address: "89 Great Eastern Street, Shoreditch, London, EC2A 3HX",
      price: 1850,
      bedrooms: 0, // Studio
      bathrooms: 1,
      property_type: "studio",
      furnishing: "furnished",
      lifestyle_features: [
        "gym",
        "rooftop_terrace",
        "concierge",
        "co_working_space",
        "bike_storage",
      ],
      available_from: new Date("2024-02-15"),
      images: [],
      is_btr: false,
      operator_id: savedUser.id,
      lat: 51.5252,
      lng: -0.0814,
    });

    const property2 = propertyRepository.create({
      title: "Old Street Modern Apartment",
      description:
        "Stylish 1-bedroom apartment on Old Street, featuring modern amenities and excellent transport links. Located in a converted warehouse with original features and contemporary finishes.",
      address: "156 Old Street, Shoreditch, London, EC1V 9BL",
      price: 2100,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "apartment",
      furnishing: "part-furnished",
      lifestyle_features: [
        "gym",
        "communal_garden",
        "bike_storage",
        "24_7_security",
      ],
      available_from: new Date("2024-03-01"),
      images: [],
      is_btr: false,
      operator_id: savedUser.id,
      lat: 51.5245,
      lng: -0.0865,
    });

    const savedProperty1 = await propertyRepository.save(property1);
    console.log("✅ Property 1 created:", savedProperty1.title);

    const savedProperty2 = await propertyRepository.save(property2);
    console.log("✅ Property 2 created:", savedProperty2.title);

    // Add media for properties
    const mediaData = [
      // Property 1: Shoreditch Loft Studio
      {
        property: savedProperty1,
        url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
        s3_key: `test-media/${savedProperty1.id}-1.jpg`,
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "shoreditch-loft-studio-1.jpg",
        file_size: Math.floor(500000 + Math.random() * 100000),
        order_index: 0,
        is_featured: true,
      },
      {
        property: savedProperty1,
        url: "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&h=600&fit=crop",
        s3_key: `test-media/${savedProperty1.id}-2.jpg`,
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "shoreditch-loft-studio-2.jpg",
        file_size: Math.floor(500000 + Math.random() * 100000),
        order_index: 1,
        is_featured: false,
      },
      {
        property: savedProperty1,
        url: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop",
        s3_key: `test-media/${savedProperty1.id}-3.jpg`,
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "shoreditch-loft-studio-3.jpg",
        file_size: Math.floor(500000 + Math.random() * 100000),
        order_index: 2,
        is_featured: false,
      },
      // Property 2: Old Street Modern Apartment
      {
        property: savedProperty2,
        url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
        s3_key: `test-media/${savedProperty2.id}-1.jpg`,
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "old-street-modern-apartment-1.jpg",
        file_size: Math.floor(500000 + Math.random() * 100000),
        order_index: 0,
        is_featured: true,
      },
      {
        property: savedProperty2,
        url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
        s3_key: `test-media/${savedProperty2.id}-2.jpg`,
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "old-street-modern-apartment-2.jpg",
        file_size: Math.floor(500000 + Math.random() * 100000),
        order_index: 1,
        is_featured: false,
      },
      {
        property: savedProperty2,
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
        s3_key: `test-media/${savedProperty2.id}-3.jpg`,
        type: "image" as const,
        mime_type: "image/jpeg",
        original_filename: "old-street-modern-apartment-3.jpg",
        file_size: Math.floor(500000 + Math.random() * 100000),
        order_index: 2,
        is_featured: false,
      },
    ];

    // Save media
    for (const mediaItem of mediaData) {
      const media = mediaRepository.create(mediaItem);
      await mediaRepository.save(media);
    }

    console.log("✅ Property media added");
    console.log(`📸 Added ${mediaData.length} images total`);

    console.log("\n🎉 Additional operator seeding completed successfully!");
    console.log("\n📋 Additional Operator Account Details:");
    console.log("Email: operator2@shoreditch.com");
    console.log("Password: operator123");
    console.log("Role: operator");
    console.log("\n🏠 Properties Created:");
    console.log(`1. ${savedProperty1.title} - £${savedProperty1.price}/month`);
    console.log(`2. ${savedProperty2.title} - £${savedProperty2.price}/month`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error("❌ Error seeding additional operator:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

// Run the seeding
seedAdditionalOperator();
