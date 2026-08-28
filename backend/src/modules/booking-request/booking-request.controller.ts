import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { BookingRequestService } from "./booking-request.service";
import { CreateBookingRequestDto } from "./dto/create-booking-request.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { ProposeViewingDto } from "./dto/propose-viewing.dto";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@/entities/user.entity";
import {
  BookingRequest,
  BookingRequestStatus,
} from "@/entities/booking-request.entity";

@ApiTags("booking-requests")
@Controller("booking-requests")
@ApiBearerAuth()
export class BookingRequestController {
  constructor(private readonly bookingRequestService: BookingRequestService) {}

  // Tighter than the global default: this route sends an email, so its ceiling
  // is set by what it costs rather than by what browsing feels like. A resubmit
  // is a legitimate repeat, hence a minute-window that allows a few.
  @Post()
  @Roles(UserRole.Tenant, UserRole.Admin)
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: "Create a booking request (tenant or admin)" })
  @ApiResponse({ status: 201, description: "Booking request created" })
  async create(
    @Body() dto: CreateBookingRequestDto,
    @Request() req
  ): Promise<BookingRequest> {
    return this.bookingRequestService.create(dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "List booking requests (admin)" })
  @ApiResponse({ status: 200, description: "Booking requests retrieved" })
  async findAll(
    @Query("status") status?: BookingRequestStatus
  ): Promise<BookingRequest[]> {
    return this.bookingRequestService.findAll(status);
  }

  @Get("me")
  @Roles(UserRole.Tenant, UserRole.Admin)
  @ApiOperation({ summary: "List my booking requests (tenant or admin)" })
  @ApiResponse({ status: 200, description: "Booking requests retrieved" })
  async findMine(
    @Request() req,
    @Query("property_id") propertyId?: string
  ): Promise<BookingRequest[]> {
    return this.bookingRequestService.findForTenant(req.user.id, propertyId);
  }

  @Patch(":id/status")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Update booking request status (admin)" })
  @ApiResponse({ status: 200, description: "Booking status updated" })
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto
  ): Promise<BookingRequest> {
    return this.bookingRequestService.updateStatus(id, dto.status);
  }

  @Patch(":id/viewing")
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary:
      "Propose a viewing slot (admin). Re-proposing clears the tenant's earlier confirmation.",
  })
  @ApiResponse({ status: 200, description: "Viewing proposed" })
  @ApiResponse({
    status: 400,
    description: "Booking not at a viewing stage, or the time is in the past",
  })
  async proposeViewing(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ProposeViewingDto
  ): Promise<BookingRequest> {
    return this.bookingRequestService.proposeViewing(
      id,
      new Date(dto.proposed_viewing_at)
    );
  }

  @Post(":id/viewing/confirm")
  @Roles(UserRole.Tenant, UserRole.Admin)
  @ApiOperation({ summary: "Confirm the proposed viewing slot (tenant, own booking)" })
  @ApiResponse({ status: 201, description: "Viewing confirmed" })
  @ApiResponse({ status: 400, description: "No viewing has been proposed yet" })
  async confirmViewing(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req
  ): Promise<BookingRequest> {
    return this.bookingRequestService.confirmViewing(id, req.user.id);
  }
}
