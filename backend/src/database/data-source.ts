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
  ],
  migrations: [path.join(__dirname, "migrations/*{.ts,.js}")],
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  ssl: false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
