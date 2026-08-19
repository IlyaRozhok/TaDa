import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { PropertyModule } from "./modules/property/property.module";
import { PropertyMediaModule } from "./modules/property-media/property-media.module";
import { ShortlistModule } from "./modules/shortlist/shortlist.module";
import { BuildingModule } from "./modules/building/building.module";
import { TenantCvModule } from "./modules/tenant-cv/tenant-cv.module";
import { BookingRequestModule } from "./modules/booking-request/booking-request.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { S3Module } from "./common/services/s3.module";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { typeOrmConfig } from "./database/typeorm.config";
import {SentryModule} from "@sentry/nestjs/setup";
import { LoggerModule } from "nestjs-pino";
import { buildLoggerParams } from "@/common/logger/logger.config";

@Module({
  imports: [
    SentryModule.forRoot(),
    LoggerModule.forRoot(buildLoggerParams(process.env)),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      ignoreEnvFile: false,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => typeOrmConfig(process.env),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 15, // 15 requests per second (allows normal browsing: property + match + booking, back, next property)
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 60, // 60 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 200, // 200 requests per minute
      }
    ]),
    // Producers emit through EventEmitter2 and return; the notification
    // listeners are the only subscribers. Registering it here is what keeps
    // auth/users/booking-requests free of any dependency on notifications.
    EventEmitterModule.forRoot(),
    // Drives the notification retry sweep. Nothing else schedules work today.
    ScheduleModule.forRoot(),
    S3Module,

    AuthModule,
    UsersModule,
    PreferencesModule,
    MatchingModule,
    PropertyModule,
    PropertyMediaModule,
    ShortlistModule,
    BuildingModule,
    TenantCvModule,
    BookingRequestModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  // APP_GUARDs run in declaration order: rate limiting first, then
  // authentication, then role checks — so RolesGuard always sees a populated
  // `request.user` and never has to guess. Mounting the pair globally is what
  // makes `@Roles(...)` impossible to leave inert: the guard that reads the
  // metadata is no longer something a route has to remember to attach.
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
