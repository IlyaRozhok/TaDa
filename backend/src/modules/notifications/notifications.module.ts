import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { NotificationsService } from "./notifications.service";
import { NotificationsListener } from "./notifications.listener";

@Module({
  imports: [EventEmitterModule],
  providers: [NotificationsService, NotificationsListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
