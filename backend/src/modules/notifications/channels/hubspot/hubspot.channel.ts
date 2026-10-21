import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { User, UserRole } from "@/entities/user.entity";
import { TenantCv } from "@/entities/tenant-cv.entity";
import { Property } from "@/entities/property.entity";
import { BookingRequest } from "@/entities/booking-request.entity";
import {
  NotificationChannel,
  NotificationMessage,
} from "@/modules/notifications/channels/notification-channel.interface";
import { NotificationType } from "@/modules/notifications/notification.templates";
import type {
  BookingRequestedEvent,
  TenantCvCompletedEvent,
  UserContactChangedEvent,
  UserRegisteredEvent,
} from "@/modules/notifications/events/notification.events";
import {
  HubspotApiError,
  HubspotClient,
  HubspotObjectType,
  HubspotPropertyDefinition,
} from "./hubspot.client";
import { readHubspotConfig } from "./hubspot.config";
import {
  advanceLifecycle,
  ContactFacts,
  contactProperties,
  CUSTOM_CONTACT_PROPERTIES,
  CUSTOM_DEAL_PROPERTIES,
  cvUrl,
  dealLinkProperties,
  dealName,
  LifecycleStage,
  propertyUrl,
  siteBase,
  splitName,
} from "./hubspot.mapping";

/** The events the CRM sync acts on; every other notification type skips it. */
const SYNCED_TYPES: ReadonlySet<string> = new Set([
  NotificationType.UserRegistered,
  NotificationType.TenantCvCompleted,
  NotificationType.BookingRequested,
  NotificationType.UserContactChanged,
]);

/** How long a custom-property check is trusted before HubSpot is asked again. */
const CUSTOM_PROPERTIES_TTL_MS = 10 * 60 * 1000;

/** The default pipeline's first stage, if the pipelines call itself fails. */
const FALLBACK_DEAL_STAGE = { pipeline: "default", stage: "appointmentscheduled" };

/**
 * One-way TaDa → HubSpot sync (contacts and deals), as a notification channel.
 *
 * Riding the notification infrastructure is what makes it safe: producers
 * only emit an event, a row is recorded per event (deduplicated), and a
 * failing or slow HubSpot leaves that row `failed` for the retry worker —
 * nothing here can reach registration, booking, the profile or the CV. With
 * HUBSPOT_ENABLED off or no token the channel is disabled and records nothing.
 *
 * Only registered users are synced: contacts are upserted by their account
 * email and their lifecycle stage only ever moves forward; a deal is created
 * once per booking request, its id stored on the row. Book a call (open to
 * anonymous visitors) is deliberately not synced.
 */
@Injectable()
export class HubspotChannel implements NotificationChannel {
  readonly name = "hubspot";
  private readonly logger = new Logger(HubspotChannel.name);

  private warnedMissingToken = false;
  private readonly warnedMissingSchemaScope = new Set<HubspotObjectType>();
  private readonly customProperties = new Map<HubspotObjectType, { names: Set<string>; checkedAt: number }>();
  private dealStage: { pipeline: string; stage: string } | null = null;

  constructor(
    private readonly client: HubspotClient,
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(TenantCv) private readonly cvs: Repository<TenantCv>,
    @InjectRepository(Property) private readonly properties: Repository<Property>,
    @InjectRepository(BookingRequest) private readonly bookings: Repository<BookingRequest>,
  ) {}

  isEnabled(): boolean {
    const config = readHubspotConfig(this.configService);
    if (config.requested && !config.token && !this.warnedMissingToken) {
      this.warnedMissingToken = true;
      this.logger.warn("HUBSPOT_ENABLED=true but HUBSPOT_ACCESS_TOKEN is not set — HubSpot sync stays off.");
    }
    return config.enabled;
  }

  handles(type: string): boolean {
    return SYNCED_TYPES.has(type);
  }

  resolveRecipient(): string {
    const { portalId } = readHubspotConfig(this.configService);
    return portalId ? `hubspot:${portalId}` : "hubspot";
  }

  async send(_recipient: string, message: NotificationMessage): Promise<void> {
    const payload = message.payload ?? {};
    switch (message.type) {
      case NotificationType.UserRegistered:
        return this.syncRegistration(payload as unknown as UserRegisteredEvent);
      case NotificationType.TenantCvCompleted:
        return this.syncCvCompleted(payload as unknown as TenantCvCompletedEvent);
      case NotificationType.BookingRequested:
        return this.syncBooking(payload as unknown as BookingRequestedEvent);
      case NotificationType.UserContactChanged:
        return this.syncContactChange(payload as unknown as UserContactChangedEvent);
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────

  /** Tenant sign-up → contact, lifecycle "lead". Other roles are not synced. */
  private async syncRegistration(event: UserRegisteredEvent): Promise<void> {
    if (event.role !== UserRole.Tenant) return;
    const facts = await this.userFacts(event.userId);
    if (facts) await this.upsertContact(facts, "lead");
  }

  /** CV completed → warm: "marketingqualifiedlead". */
  private async syncCvCompleted(event: TenantCvCompletedEvent): Promise<void> {
    const facts = await this.userFacts(event.userId);
    if (facts) await this.upsertContact(facts, "marketingqualifiedlead");
  }

  /**
   * Phone or name changed → refresh the contact's fields from the current
   * profile. A field refresh, not a stage change: the lifecycle stage is left
   * as it is. Tenants only, like the registration sync.
   */
  private async syncContactChange(event: UserContactChangedEvent): Promise<void> {
    const facts = await this.userFacts(event.userId);
    if (facts?.source === "tenant") await this.upsertContact(facts, null);
  }

  /** Booking request → hot: "salesqualifiedlead", plus one deal per request. */
  private async syncBooking(event: BookingRequestedEvent): Promise<void> {
    const facts = await this.userFacts(event.tenant.id);
    if (!facts) return;
    const contactId = await this.upsertContact(facts, "salesqualifiedlead");
    if (!contactId) return;

    const property = await this.properties.findOne({
      where: { id: event.property.id },
      select: { id: true, title: true, price: true },
    });
    const title = property?.title ?? event.property.title;
    const name = [facts.firstName, facts.lastName].filter(Boolean).join(" ") || facts.email || "";
    const price = Number(property?.price);
    const links = dealLinkProperties(
      { cvUrl: facts.cvUrl, propertyUrl: propertyUrl(event.property.id, this.siteBase()) },
      await this.availableCustomProperties("deals"),
    );

    await this.createDealOnce(this.bookings, event.bookingId, contactId, {
      dealname: dealName(name, title),
      ...(price > 0 ? { amount: String(price) } : {}),
      ...links,
    });
  }

  /** Links point at this host's frontend (FRONTEND_URL): stage → stage, prod → prod. */
  private siteBase(): string {
    return siteBase(this.configService.get<string>("FRONTEND_URL"));
  }

  // ── Contacts ──────────────────────────────────────────────────────────────

  /** What the profile knows about a user, read from the database by id. */
  private async userFacts(userId: string): Promise<ContactFacts | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user?.email) return null;

    const cv = await this.cvs.findOne({
      where: { user_id: userId },
      select: { id: true, share_uuid: true },
    });
    const fallback = splitName(user.full_name);

    return {
      email: user.email,
      firstName: user.first_name || fallback.first,
      lastName: user.last_name || fallback.last,
      phone: user.phone,
      nationality: user.nationality,
      source:
        user.role === UserRole.Tenant ? "tenant" : user.role === UserRole.Operator ? "operator" : null,
      signupDate: user.created_at,
      cvUrl: cvUrl(cv?.share_uuid, this.siteBase()),
    };
  }

  /**
   * Find the contact by email, update it or create it. The lifecycle stage is
   * written only when it moves forward; a null stage never touches it.
   * Returns the contact id, or null without an email to identify it by.
   */
  private async upsertContact(facts: ContactFacts, stage: LifecycleStage | null): Promise<string | null> {
    const email = facts.email?.trim().toLowerCase() || null;
    if (!email) return null;

    const properties = contactProperties(facts, await this.availableCustomProperties("contacts"));
    const find = () => this.client.findContact(email);

    let existing = await find();
    if (!existing) {
      try {
        const created = await this.client.createContact(
          stage ? { ...properties, lifecyclestage: stage } : properties,
        );
        return created.id;
      } catch (error) {
        // Created in between by someone else (409): fall through to update it.
        if (!(error instanceof HubspotApiError && error.status === 409)) throw error;
        existing = await find();
        if (!existing) throw error;
      }
    }

    const next = stage ? advanceLifecycle(existing.properties.lifecyclestage, stage) : null;
    const update = next ? { ...properties, lifecyclestage: next } : properties;
    if (Object.keys(update).length > 0) await this.client.updateContact(existing.id, update);
    return existing.id;
  }

  /**
   * The TaDa custom properties that exist on the object in the portal,
   * creating missing ones when the key has that object's schema scope
   * (crm.schemas.contacts.write / crm.schemas.deals.write). Without it the
   * sync carries on without them and says once which to create by hand.
   */
  private async availableCustomProperties(objectType: HubspotObjectType): Promise<Set<string>> {
    const cached = this.customProperties.get(objectType);
    if (cached && Date.now() - cached.checkedAt < CUSTOM_PROPERTIES_TTL_MS) return cached.names;

    const definitions: HubspotPropertyDefinition[] =
      objectType === "contacts" ? CUSTOM_CONTACT_PROPERTIES : CUSTOM_DEAL_PROPERTIES;
    const names = new Set<string>();
    const missing: string[] = [];
    try {
      for (const definition of definitions) {
        if (await this.client.propertyExists(objectType, definition.name)) {
          names.add(definition.name);
          continue;
        }
        try {
          await this.client.createProperty(objectType, definition);
          names.add(definition.name);
          this.logger.log(`HubSpot: created ${objectType} property ${definition.name}.`);
        } catch (error) {
          if (!(error instanceof HubspotApiError && error.status === 403)) throw error;
          missing.push(definition.name);
        }
      }
    } catch (error) {
      if (!(error instanceof HubspotApiError && error.status === 403)) {
        // Transient: sync without them now, check again next time.
        this.logger.warn(`HubSpot: could not check ${objectType} properties: ${String(error)}`);
        return names;
      }
      missing.push(...definitions.map((d) => d.name).filter((name) => !names.has(name) && !missing.includes(name)));
    }

    if (missing.length > 0 && !this.warnedMissingSchemaScope.has(objectType)) {
      this.warnedMissingSchemaScope.add(objectType);
      const manual = definitions
        .filter((d) => missing.includes(d.name))
        .map((d) => `${d.name} (${d.fieldType === "date" ? "date picker" : "single-line text"})`);
      this.logger.warn(
        `HubSpot: the key lacks crm.schemas.${objectType}.read/write, so these ${objectType} properties ` +
          `are not synced until created by hand: ${manual.join(", ")}.`,
      );
    }
    this.customProperties.set(objectType, { names, checkedAt: Date.now() });
    return names;
  }

  // ── Deals ─────────────────────────────────────────────────────────────────

  /** The default deal pipeline and its first stage. */
  private async defaultDealStage(): Promise<{ pipeline: string; stage: string }> {
    if (this.dealStage) return this.dealStage;
    try {
      const pipelines = await this.client.getDealPipelines();
      const pipeline =
        pipelines.find((p) => p.id === "default") ??
        [...pipelines].sort((a, b) => a.displayOrder - b.displayOrder)[0];
      const stage = pipeline && [...pipeline.stages].sort((a, b) => a.displayOrder - b.displayOrder)[0];
      if (pipeline && stage) {
        this.dealStage = { pipeline: pipeline.id, stage: stage.id };
        return this.dealStage;
      }
    } catch (error) {
      this.logger.warn(`HubSpot: could not read deal pipelines, using the default: ${String(error)}`);
    }
    return FALLBACK_DEAL_STAGE;
  }

  /**
   * One deal per originating row: skipped when the row already holds a deal
   * id, and the new id is written back. Once the deal exists a failure to
   * record its id is logged, not thrown — a retry would create a duplicate.
   */
  private async createDealOnce(
    repository: Repository<BookingRequest>,
    rowId: string,
    contactId: string,
    properties: Record<string, string>,
  ): Promise<void> {
    const repo = repository as Repository<{ id: string; hubspot_deal_id?: string | null }>;
    const row = await repo
      .createQueryBuilder("r")
      .select("r.id")
      .addSelect("r.hubspot_deal_id")
      .where("r.id = :id", { id: rowId })
      .getOne();
    if (!row || row.hubspot_deal_id) return;

    const { pipeline, stage } = await this.defaultDealStage();
    const dealId = await this.client.createDeal({ ...properties, pipeline, dealstage: stage }, contactId);

    try {
      await repo.update({ id: rowId, hubspot_deal_id: IsNull() }, { hubspot_deal_id: dealId });
    } catch (error) {
      this.logger.error(
        `HubSpot: deal ${dealId} created but not recorded on ${rowId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
