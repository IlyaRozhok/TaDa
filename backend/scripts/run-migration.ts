import "reflect-metadata";
import { DataSource } from "typeorm";
import { dataSourceOptions } from "../src/database/data-source";

async function runMigrations() {
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log("🔄 Running migrations...");

    await dataSource.runMigrations();
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runMigrations();
