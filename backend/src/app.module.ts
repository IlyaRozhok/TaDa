import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

// Entities
import { User, Preferences } from "./entities";

// Modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { ShortlistModule } from "./modules/shortlist/shortlist.module";
import { FavouritesModule } from "./modules/favourites/favourites.module";
import { dataSourceOptions } from "./database/data-source";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Database
    TypeOrmModule.forRoot(dataSourceOptions),

    // Feature modules
    AuthModule,
    UsersModule,
    PreferencesModule,
    MatchingModule,
    PropertiesModule,
    ShortlistModule,
    FavouritesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
