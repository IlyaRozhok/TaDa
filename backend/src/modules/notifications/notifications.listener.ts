import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { NotificationsService } from "./notifications.service";
import { UserCreatedEvent } from "./events/user-created.event";
import { TenantCvSharedEvent } from "./events/tenant-cv-shared.event";
import { BookingRequestCreatedEvent } from "./events/booking-request-created.event";

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);
  private readonly adminEmail: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.adminEmail = this.configService.get<string>("NOTIFICATIONS_EMAIL") ?? "admin@tada.app";
    this.frontendUrl = this.configService.get<string>("FRONTEND_URL") ?? "https://tada.app";
  }

  @OnEvent("user.created")
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`New user registered: ${event.email} (${event.role})`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New User Registered</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Email</td>
            <td style="padding: 8px 0;">${event.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Role</td>
            <td style="padding: 8px 0;">${event.role}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Registered at</td>
            <td style="padding: 8px 0;">${event.createdAt.toISOString()}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          <a href="${this.frontendUrl}/app/admin/users" style="color: #2563eb;">View in admin panel</a>
        </p>
      </div>
    `;

    await this.notificationsService.sendEmail(
      this.adminEmail,
      "[TaDa] New user registered",
      html,
    );
  }

  @OnEvent("tenant-cv.shared")
  async handleTenantCvShared(event: TenantCvSharedEvent): Promise<void> {
    this.logger.log(`Tenant CV shared: ${event.email}`);

    const cvUrl = `${this.frontendUrl}/cv/${event.shareUuid}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Tenant CV Shared</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Tenant email</td>
            <td style="padding: 8px 0;">${event.email}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          <a href="${cvUrl}" style="color: #2563eb;">View tenant CV</a>
        </p>
      </div>
    `;

    await this.notificationsService.sendEmail(
      this.adminEmail,
      "[TaDa] Tenant CV shared",
      html,
    );
  }

  @OnEvent("booking-request.created")
  async handleBookingRequestCreated(event: BookingRequestCreatedEvent): Promise<void> {
    this.logger.log(`New booking request: ${event.tenantEmail} for property ${event.propertyId}`);

    const dateRange = event.dateFrom && event.dateTo
      ? `${event.dateFrom} — ${event.dateTo}`
      : event.dateFrom ?? "Not specified";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Viewing Request</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Tenant</td>
            <td style="padding: 8px 0;">${event.tenantName ?? "N/A"} (${event.tenantEmail})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Property</td>
            <td style="padding: 8px 0;">${event.propertyTitle ?? event.propertyId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Requested dates</td>
            <td style="padding: 8px 0;">${dateRange}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          <a href="${this.frontendUrl}/app/admin/requests" style="color: #2563eb;">View in admin panel</a>
        </p>
      </div>
    `;

    await this.notificationsService.sendEmail(
      this.adminEmail,
      "[TaDa] New viewing request",
      html,
    );
  }
}
