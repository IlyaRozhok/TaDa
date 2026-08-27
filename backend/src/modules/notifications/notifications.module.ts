import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Notification } from "@/entities/notification.entity";
import { EmailModule } from "@/common/services/email.module";
import { notificationChannelProviders } from "./channels";
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
    TypeOrmModule.forFeature([Notification]),
  ],
  providers: [
    ...notificationChannelProviders,
    NotificationsService,
    NotificationsRetryWorker,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
