import { DataSource } from "typeorm";
import { dataSourceOptions } from "../src/database/data-source";

async function deployMigrations() {
  console.log("🚀 Starting migration deployment...");

  // Create data source
  const dataSource = new DataSource({
    ...dataSourceOptions,
    synchronize: false, // Never use synchronize in production
    logging: true,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log("✅ Database connection established");

    // Check if migrations table exists
    const hasMigrationsTable = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'migrations'
      );
    `);

    if (!hasMigrationsTable[0].exists) {
      console.log("📋 Creating migrations table...");
      await dataSource.query(`
        CREATE TABLE "migrations" (
          "id" SERIAL PRIMARY KEY,
          "timestamp" bigint NOT NULL,
          "name" character varying NOT NULL
        )
      `);
      console.log("✅ Migrations table created");
    }

    // Get pending migrations
    const pendingMigrations = await dataSource.showMigrations();

    if (pendingMigrations === false) {
      console.log("✅ No pending migrations found");
    } else {
      console.log(`📋 Found pending migrations, running them...`);

      // Run migrations
      console.log("🔄 Running migrations...");
      await dataSource.runMigrations();
      console.log("✅ All migrations completed successfully");
    }

    // Verify database schema
    console.log("🔍 Verifying database schema...");
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log("📊 Database tables:");
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
  } catch (error) {
    console.error("❌ Migration deployment failed:", error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log("🔌 Database connection closed");
    }
  }

  console.log("🎉 Migration deployment completed successfully!");
}

// Run if called directly
if (require.main === module) {
  deployMigrations().catch(console.error);
}

export default deployMigrations;
