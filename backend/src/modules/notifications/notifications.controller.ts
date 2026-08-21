import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Throttle } from "@nestjs/throttler";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Public } from "@/common/decorators/public.decorator";
import { CreateDemoRequestDto } from "./dto/create-demo-request.dto";
import {
  DemoRequestedEvent,
  NotificationEvents,
} from "./events/notification.events";

/**
 * The one public write into the notification pipeline: the landing page's
 * demo-request form. It replaces the EmailJS browser integration — the form
 * used to mail the support inbox directly from the client with keys served by
 * a frontend route; now the client posts here and delivery goes through the
 * same durable SES outbox as every other notification.
 *
 * The controller only validates and emits. It never touches the database or
 * SES itself, so nothing on this path can fail into the sender's request —
 * the same decoupling every other producer gets from EventEmitter2.
 */
@ApiTags("notifications")
@Controller("demo-requests")
export class NotificationsController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Post()
  @Public()
  @HttpCode(202)
  // Email-producing and unauthenticated — throttled like the auth endpoints.
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Submit a demo request from the public landing form" })
  @ApiResponse({ status: 202, description: "Request accepted for delivery" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  requestDemo(@Body() dto: CreateDemoRequestDto): { success: true } {
    const event: DemoRequestedEvent = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      source: dto.source ?? "Website",
      requestedAt: new Date(),
    };

    this.eventEmitter.emit(NotificationEvents.DemoRequested, event);

    // 202: accepted for delivery. Whether SES ultimately sends it is the
    // outbox's and retry worker's business, not this request's.
    return { success: true };
  }
}
