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
      existing.status = BookingRequestStatus.New;
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
      },
      dateFrom: booking.date_from
        ? new Date(booking.date_from).toISOString().slice(0, 10)
        : null,
      dateTo: booking.date_to
        ? new Date(booking.date_to).toISOString().slice(0, 10)
        : null,
      emailProvided: Boolean(booking.email),
      phoneProvided: Boolean(booking.phone_number),
      descriptionProvided: Boolean(booking.description),
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

    request.status = status;
    return this.bookingRequestRepository.save(request);
  }
}
