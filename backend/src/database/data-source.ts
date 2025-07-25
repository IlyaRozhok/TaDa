import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "../entities/user.entity";
import { TenantProfile } from "../entities/tenant-profile.entity";
import { OperatorProfile } from "../entities/operator-profile.entity";
import { Preferences } from "../entities/preferences.entity";
import { Property } from "../entities/property.entity";
import { PropertyMedia } from "../entities/property-media.entity";
import { Shortlist } from "../entities/shortlist.entity";
import { Favourite } from "../entities/favourite.entity";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
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
    Favourite,
  ],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  synchronize: true,
  logging: process.env.NODE_ENV === "development",
  ssl: false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
