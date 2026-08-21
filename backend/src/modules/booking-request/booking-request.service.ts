import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import {
  BookingRequest,
  BookingRequestStatus,
} from "../../entities/booking-request.entity";
import { Property } from "../../entities/property.entity";
import { CreateBookingRequestDto } from "./dto/create-booking-request.dto";
import {
  BookingRequestedEvent,
  NotificationEvents,
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

    const saved = await this.bookingRequestRepository.save(request);

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

    request.status = status;
    return this.bookingRequestRepository.save(request);
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
