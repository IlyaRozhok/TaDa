import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv";
import { User } from "../entities/user.entity";
import { TenantProfile } from "../entities/tenant-profile.entity";
import { OperatorProfile } from "../entities/operator-profile.entity";
import { Preferences } from "../entities/preferences.entity";
import { Property } from "../entities/property.entity";
import { PropertyMedia } from "../entities/property-media.entity";
import { Shortlist } from "../entities/shortlist.entity";
import { Building } from "../entities/building.entity";
import { BookingRequest } from "../entities/booking-request.entity";
import { TenantCv } from "../entities/tenant-cv.entity";
import * as path from "path";

// Load environment variables
config({ path: ".env" });

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "rental_platform",
  entities: [
    User,
    TenantProfile,
    OperatorProfile,
    Preferences,
    Property,
    PropertyMedia,
    Shortlist,
    Building,
    BookingRequest,
    TenantCv,
  ],
  migrations: [path.join(__dirname, "migrations/*{.ts,.js}")],
  // "each" instead of the default "all": a migration may only opt out of its
  // transaction (`transaction = false`) when the mode is "each" or "none", and
  // `CREATE INDEX CONCURRENTLY` in AddPerformanceIndexes1785801600000 cannot
  // run inside a transaction block. Under "each" every other migration keeps
  // its own transaction — the difference from "all" is that a run of several
  // pending migrations no longer rolls back the ones that already succeeded.
  migrationsTransactionMode: "each",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  ssl: false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
