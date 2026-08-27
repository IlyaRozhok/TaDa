import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Notification } from "@/entities/notification.entity";
import { User } from "@/entities/user.entity";
import { Property } from "@/entities/property.entity";
import { EmailModule } from "@/common/services/email.module";
import { notificationChannelProviders } from "./channels";
import { NotificationsController } from "./notifications.controller";
import { NotificationsRetryWorker } from "./notifications.retry.worker";
import { NotificationsService } from "./notifications.service";

/**
 * Global so the producers do not have to import it: they never inject anything
 * from here. They talk to `EventEmitter2`, which is global in its own right —
 * the module is registered only because the listeners have to be instantiated
 * somewhere.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    EmailModule,
    // User and Property are read-only here: the service resolves recipient
    // addresses from the database by id (invariant 2 — payloads never carry
    // a delivery address).
    TypeOrmModule.forFeature([Notification, User, Property]),
  ],
  controllers: [NotificationsController],
  providers: [
    ...notificationChannelProviders,
    NotificationsService,
    NotificationsRetryWorker,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
