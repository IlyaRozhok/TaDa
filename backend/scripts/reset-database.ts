import { DataSource } from "typeorm";
import { dataSourceOptions } from "../src/database/data-source";

async function resetDatabase() {
  const dataSource = new DataSource({
    ...dataSourceOptions,
    database: "postgres", // Connect to default database to drop/create our database
  });

  try {
    await dataSource.initialize();
    console.log("Connected to PostgreSQL");

    const dbName = dataSourceOptions.database as string;

    // Check if database exists
    const dbExists = await dataSource.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbExists.length > 0) {
      console.log(`Dropping database: ${dbName}`);
      // Terminate all connections to the database
      await dataSource.query(
        `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `,
        [dbName]
      );

      await dataSource.query(`DROP DATABASE "${dbName}"`);
      console.log(`Database ${dbName} dropped successfully`);
    }

    console.log(`Creating database: ${dbName}`);
    await dataSource.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database ${dbName} created successfully`);

    await dataSource.destroy();
    console.log("Database reset completed successfully!");
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();
