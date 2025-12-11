import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  BookingRequest,
  BookingRequestStatus,
} from "../../entities/booking-request.entity";
import { Property } from "../../entities/property.entity";
import { CreateBookingRequestDto } from "./dto/create-booking-request.dto";
import { TenantCv } from "../../entities/tenant-cv.entity";

@Injectable()
export class BookingRequestService {
  constructor(
    @InjectRepository(BookingRequest)
    private readonly bookingRequestRepository: Repository<BookingRequest>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>
  ) {}

  async create(
    dto: CreateBookingRequestDto,
    tenantId: string
  ): Promise<BookingRequest> {
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
      return this.bookingRequestRepository.save(existing);
    }

    const request = this.bookingRequestRepository.create({
      property_id: dto.property_id,
      tenant_id: tenantId,
      status: BookingRequestStatus.New,
    });

    const saved = await this.bookingRequestRepository.save(request);

    return this.bookingRequestRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ["property", "tenant"],
    });
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
