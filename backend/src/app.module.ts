import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { PropertyMediaModule } from "./modules/property-media/property-media.module";
import { ShortlistModule } from "./modules/shortlist/shortlist.module";
import { BuildingModule } from "./modules/building/building.module";
import { TenantCvModule } from "./modules/tenant-cv/tenant-cv.module";
import { BookingRequestModule } from "./modules/booking-request/booking-request.module";
import { S3Module } from "./common/services/s3.module";
import { typeOrmConfig } from "./database/typeorm.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      ignoreEnvFile: false,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => typeOrmConfig(process.env),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      }
    ]),
    S3Module,

    AuthModule,
    UsersModule,
    PreferencesModule,
    MatchingModule,
    PropertiesModule,
    PropertyMediaModule,
    ShortlistModule,
    BuildingModule,
    TenantCvModule,
    BookingRequestModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
