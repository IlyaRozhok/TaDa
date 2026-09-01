import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EntityManager, In, Repository } from "typeorm";
import {
  BOOKING_UNDER_OFFER_STAGES,
  BookingRequest,
  BookingRequestStatus,
} from "@/entities/booking-request.entity";
import { Property, PropertyStatus } from "../../entities/property.entity";
import { CreateBookingRequestDto } from "./dto/create-booking-request.dto";
import {
  BookingRequestedEvent,
  BookingStatusChangedEvent,
  NotificationEvents,
  ViewingConfirmedEvent,
  ViewingProposedEvent,
} from "@/modules/notifications/events/notification.events";

@Injectable()
export class BookingRequestService {
  constructor(
    @InjectRepository(BookingRequest)
    private readonly bookingRequestRepository: Repository<BookingRequest>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(
    dto: CreateBookingRequestDto,
    tenantId: string
  ): Promise<BookingRequest> {
    const email = dto.email?.trim() || null;
    const phone = dto.phone_number?.trim() || null;
    const description = dto.description?.trim() || null;
    if (!email && !phone) {
      throw new BadRequestException("email or phone_number is required");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException("Invalid email address");
    }

    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;
    if (dto.date_from) {
      dateFrom = new Date(dto.date_from + "T00:00:00.000Z");
      if (Number.isNaN(dateFrom.getTime())) {
        throw new BadRequestException("Invalid date_from");
      }
    }
    if (dto.date_to) {
      dateTo = new Date(dto.date_to + "T00:00:00.000Z");
      if (Number.isNaN(dateTo.getTime())) {
        throw new BadRequestException("Invalid date_to");
      }
    }
    if (dateFrom && dateTo && dateTo < dateFrom) {
      throw new BadRequestException("date_to must be on or after date_from");
    }

    const property = await this.propertyRepository.findOne({
      where: { id: dto.property_id },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    const existing = await this.bookingRequestRepository.findOne({
      where: { property_id: dto.property_id, tenant_id: tenantId },
      relations: ["property", "tenant"],
    });

    if (existing) {
      // The resubmit branch used to reset ANY booking to `new`, silently
      // undoing the whole pipeline — including a signed tenancy — and
      // bypassing the state machine updateStatus enforces. The lifecycle now
      // applies here too:
      // - `rented`: the deal is closed — a new enquiry cannot reopen it;
      // - `cancel_booking`: a returning tenant legitimately re-applies, the
      //   booking reopens at the start of the pipeline;
      // - any active stage: progress is KEPT — the tenant is updating their
      //   contact details or dates, not restarting the operator's work.
      if (existing.status === BookingRequestStatus.Rented) {
        throw new BadRequestException(
          "This property is already rented through your booking — the request cannot be re-opened",
        );
      }

      if (existing.status === BookingRequestStatus.CancelBooking) {
        // Re-opening a cancelled booking is a NEW enquiry — it needs the
        // property to still be on the market. Updating contact details on an
        // in-flight deal (the branch below) does not.
        this.assertPropertyBookable(property);
        existing.status = BookingRequestStatus.New;
      }

      existing.email = email;
      existing.phone_number = phone;
      existing.date_from = dateFrom;
      existing.date_to = dateTo;
      existing.description = description;
      const resubmitted = await this.bookingRequestRepository.save(existing);

      this.emitBookingRequested(resubmitted, property, false);

      return resubmitted;
    }

    this.assertPropertyBookable(property);

    const request = this.bookingRequestRepository.create({
      property_id: dto.property_id,
      tenant_id: tenantId,
      status: BookingRequestStatus.New,
      email,
      phone_number: phone,
      date_from: dateFrom,
      date_to: dateTo,
      description,
    });

    let saved: BookingRequest;
    try {
      saved = await this.bookingRequestRepository.save(request);
    } catch (error) {
      // Unique (tenant_id, property_id) violation: a concurrent duplicate
      // submit lost the race. Surfaced as a raw QueryFailedError it became a
      // 500 and a Sentry page; it is a client-resolvable conflict.
      if ((error as { code?: string })?.code === "23505") {
        throw new ConflictException(
          "A booking request for this property already exists — reload and resubmit"
        );
      }
      throw error;
    }

    const created = await this.bookingRequestRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ["property", "tenant"],
    });

    this.emitBookingRequested(created, property, true);

    return created;
  }

  /**
   * Announces a booking request to whoever is listening — today, the internal
   * notification service. Fire-and-forget: `emit` returns before any listener
   * finishes, so a failing mailbox cannot turn a saved request into a 500.
   *
   * The tenant relation is present on the first-create path (reloaded with
   * relations) but not on the resubmit path, where the entity was only saved.
   * Both are handled rather than forcing an extra query for an email body.
   */
  private emitBookingRequested(
    booking: BookingRequest,
    property: Property,
    isFirstRequest: boolean
  ): void {
    this.eventEmitter.emit(NotificationEvents.BookingRequested, {
      bookingId: booking.id,
      isFirstRequest,
      // Distinguishes each resubmit from the original and from one another, so
      // the dedupe key does not swallow a genuinely new submission.
      revision: new Date(booking.updated_at ?? Date.now()).toISOString(),
      property: {
        id: property.id,
        title: property.title ?? null,
        address: property.address ?? null,
      },
      tenant: {
        id: booking.tenant_id,
        name: booking.tenant?.full_name ?? null,
        email: booking.tenant?.email ?? booking.email ?? null,
        phone: booking.phone_number ?? null,
      },
      dateFrom: booking.date_from
        ? new Date(booking.date_from).toISOString().slice(0, 10)
        : null,
      dateTo: booking.date_to
        ? new Date(booking.date_to).toISOString().slice(0, 10)
        : null,
      message: booking.description ?? null,
    } satisfies BookingRequestedEvent);
  }

  async findAll(status?: BookingRequestStatus): Promise<BookingRequest[]> {
    const where = status ? { status } : {};
    const requests = await this.bookingRequestRepository.find({
      where,
      relations: ["property", "tenant", "tenant.tenantCv"],
      order: { created_at: "DESC" },
    });

    return requests;
  }

  async findForTenant(
    tenantId: string,
    propertyId?: string
  ): Promise<BookingRequest[]> {
    const where: any = { tenant_id: tenantId };
    if (propertyId) {
      where.property_id = propertyId;
    }

    return this.bookingRequestRepository.find({
      where,
      relations: ["property", "tenant", "tenant.tenantCv"],
      order: { created_at: "DESC" },
    });
  }

  async updateStatus(
    id: string,
    status: BookingRequestStatus
  ): Promise<BookingRequest> {
    const request = await this.bookingRequestRepository.findOne({
      where: { id },
      relations: ["property", "tenant"],
    });

    if (!request) {
      throw new NotFoundException("Booking request not found");
    }

    if (!Object.values(BookingRequestStatus).includes(status)) {
      throw new BadRequestException("Invalid status");
    }

    // Same status: idempotent no-op, so a double-click in the admin panel
    // neither errors nor rewrites updated_at.
    if (request.status === status) {
      return request;
    }

    this.assertStatusTransition(request.status, status);

    // One transaction: the booking transition and the property-lifecycle
    // side-effect land or roll back together.
    await this.bookingRequestRepository.manager.transaction(async (em) => {
      // Compare-and-swap: the UPDATE only lands if the status is still the
      // one this request validated against. A plain save() wrote
      // unconditionally, so two admins racing could overwrite a terminal
      // `rented` with a stale transition that had passed validation against
      // an old snapshot.
      const result = await em.getRepository(BookingRequest).update(
        { id, status: request.status },
        { status }
      );

      if (!result.affected) {
        throw new ConflictException(
          "Booking status was changed by someone else — reload and retry"
        );
      }

      await this.applyPropertyLifecycle(em, request, status);
    });

    const from = request.status;
    request.status = status;

    // Announce AFTER the transaction committed: an email about a transition
    // that rolled back would be a lie. Fire-and-forget like every other
    // notification event.
    this.eventEmitter.emit(NotificationEvents.BookingStatusChanged, {
      bookingId: request.id,
      propertyId: request.property_id,
      tenantId: request.tenant_id,
      from,
      to: status,
      property: {
        title: request.property?.title ?? null,
        address: request.property?.address ?? null,
      },
    } satisfies BookingStatusChangedEvent);

    return request;
  }

  /**
   * Stages at which a viewing appointment makes sense: approved for one, or
   * already at the viewing step.
   */
  private static readonly VIEWING_STAGES: BookingRequestStatus[] = [
    BookingRequestStatus.ApprovedViewing,
    BookingRequestStatus.Viewing,
  ];

  /**
   * Admin proposes a viewing slot. Re-proposing a new time clears any earlier
   * confirmation — the tenant confirmed a slot that no longer stands.
   */
  async proposeViewing(id: string, proposedAt: Date): Promise<BookingRequest> {
    const request = await this.bookingRequestRepository.findOne({
      where: { id },
      relations: ["property"],
    });

    if (!request) {
      throw new NotFoundException("Booking request not found");
    }

    if (!BookingRequestService.VIEWING_STAGES.includes(request.status)) {
      throw new BadRequestException(
        `A viewing can be proposed at the "${BookingRequestService.VIEWING_STAGES.join('" or "')}" stages — this booking is at "${request.status}"`,
      );
    }

    if (proposedAt.getTime() <= Date.now()) {
      throw new BadRequestException("The proposed viewing time must be in the future");
    }

    request.proposed_viewing_at = proposedAt;
    request.viewing_confirmed_at = null;
    const saved = await this.bookingRequestRepository.save(request);

    this.eventEmitter.emit(NotificationEvents.ViewingProposed, {
      bookingId: saved.id,
      propertyId: saved.property_id,
      tenantId: saved.tenant_id,
      proposedAt: proposedAt.toISOString(),
      property: {
        title: request.property?.title ?? null,
        address: request.property?.address ?? null,
      },
    } satisfies ViewingProposedEvent);

    return saved;
  }

  /** Tenant confirms the proposed slot on their own booking. */
  async confirmViewing(id: string, tenantId: string): Promise<BookingRequest> {
    const request = await this.bookingRequestRepository.findOne({
      where: { id },
      relations: ["property"],
    });

    if (!request) {
      throw new NotFoundException("Booking request not found");
    }

    if (request.tenant_id !== tenantId) {
      throw new ForbiddenException("You can only confirm your own viewing");
    }

    if (!request.proposed_viewing_at) {
      throw new BadRequestException("No viewing has been proposed yet");
    }

    // Idempotent: confirming twice keeps the first confirmation timestamp.
    if (!request.viewing_confirmed_at) {
      request.viewing_confirmed_at = new Date();
      await this.bookingRequestRepository.save(request);

      this.eventEmitter.emit(NotificationEvents.ViewingConfirmed, {
        bookingId: request.id,
        propertyId: request.property_id,
        tenantId: request.tenant_id,
        proposedAt: new Date(request.proposed_viewing_at).toISOString(),
        confirmedAt: request.viewing_confirmed_at.toISOString(),
        property: {
          title: request.property?.title ?? null,
          address: request.property?.address ?? null,
        },
      } satisfies ViewingConfirmedEvent);
    }

    return request;
  }

  /** See BOOKING_UNDER_OFFER_STAGES — shared with the user-deletion path. */
  private static readonly UNDER_OFFER_STAGES = BOOKING_UNDER_OFFER_STAGES;

  /**
   * The booking pipeline drives the property's listing lifecycle:
   *
   * - `rented` closes the deal → the property is `let`. Unconditional: a
   *   closed tenancy trumps whatever the listing said.
   * - reaching a contract-or-later stage lifts a `listed` property to
   *   `under_offer` (only from `listed` — a hand-set draft/archived is an
   *   operator decision this hook must not override);
   * - LEAVING the contract stages (cancel, or the one-step-back undo) drops
   *   `under_offer` back to `listed`, but only when no other booking on the
   *   property is still at a contract-or-later stage. This booking's own row
   *   is already updated inside this transaction, so a plain count sees the
   *   post-transition world.
   *
   * Runs inside the caller's transaction; before this hook existed nothing
   * ever unlisted a rented flat — it kept ranking in Best Match forever.
   */
  private async applyPropertyLifecycle(
    em: EntityManager,
    request: BookingRequest,
    newStatus: BookingRequestStatus
  ): Promise<void> {
    const properties = em.getRepository(Property);
    const stages = BookingRequestService.UNDER_OFFER_STAGES;

    if (newStatus === BookingRequestStatus.Rented) {
      await properties.update(
        { id: request.property_id },
        { status: PropertyStatus.Let }
      );
      return;
    }

    if (stages.includes(newStatus)) {
      await properties.update(
        { id: request.property_id, status: PropertyStatus.Listed },
        { status: PropertyStatus.UnderOffer }
      );
      return;
    }

    if (stages.includes(request.status)) {
      const stillUnderOffer = await em.getRepository(BookingRequest).count({
        where: { property_id: request.property_id, status: In(stages) },
      });
      if (stillUnderOffer === 0) {
        await properties.update(
          { id: request.property_id, status: PropertyStatus.UnderOffer },
          { status: PropertyStatus.Listed }
        );
      }
    }
  }

  /**
   * A new enquiry needs the property on the market. `under_offer` still
   * accepts enquiries on purpose — deals fall through, and operators want
   * backup applicants; `let`, `draft` and `archived` do not.
   */
  private assertPropertyBookable(property: Property): void {
    const status = property.status ?? PropertyStatus.Listed;
    if (
      status === PropertyStatus.Listed ||
      status === PropertyStatus.UnderOffer
    ) {
      return;
    }
    throw new BadRequestException(
      "This property is not available for booking"
    );
  }

  /**
   * Booking pipeline in order. `cancel_booking` sits outside it — reachable
   * from any active stage, like `rented` a terminal one.
   */
  private static readonly PIPELINE: BookingRequestStatus[] = [
    BookingRequestStatus.New,
    BookingRequestStatus.Contacting,
    BookingRequestStatus.KycReferencing,
    BookingRequestStatus.ApprovedViewing,
    BookingRequestStatus.Viewing,
    BookingRequestStatus.Contract,
    BookingRequestStatus.Deposit,
    BookingRequestStatus.FullPayment,
    BookingRequestStatus.MoveIn,
    BookingRequestStatus.Rented,
  ];

  /**
   * The lifecycle this enforces (there was none before — `rented → new` was
   * legal):
   *
   * - `rented` and `cancel_booking` are terminal: nothing leaves them.
   *   Reopening a closed deal is a deliberate data fix, not a dropdown click.
   * - any active stage may move FORWARD any number of steps (real deals skip
   *   stages), or to `cancel_booking`;
   * - exactly ONE step backward is allowed, so an admin can undo a misclick
   *   without cancelling the deal — but `contract → new` style resets are out.
   */
  private assertStatusTransition(
    from: BookingRequestStatus,
    to: BookingRequestStatus
  ): void {
    if (
      from === BookingRequestStatus.Rented ||
      from === BookingRequestStatus.CancelBooking
    ) {
      throw new BadRequestException(
        `Status "${from}" is terminal — a closed booking cannot move to "${to}"`
      );
    }

    if (to === BookingRequestStatus.CancelBooking) {
      return;
    }

    const fromIndex = BookingRequestService.PIPELINE.indexOf(from);
    const toIndex = BookingRequestService.PIPELINE.indexOf(to);

    if (toIndex < fromIndex - 1) {
      throw new BadRequestException(
        `Cannot move a booking from "${from}" back to "${to}" — only one step back is allowed`
      );
    }
  }
}
