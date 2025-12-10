import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { BookingRequestService } from "./booking-request.service";
import { CreateBookingRequestDto } from "./dto/create-booking-request.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import {
  BookingRequest,
  BookingRequestStatus,
} from "../../entities/booking-request.entity";

@ApiTags("booking-requests")
@Controller("booking-requests")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookingRequestController {
  constructor(private readonly bookingRequestService: BookingRequestService) {}

  @Post()
  @Roles(UserRole.Tenant)
  @ApiOperation({ summary: "Create a booking request (tenant)" })
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
  @Roles(UserRole.Tenant)
  @ApiOperation({ summary: "List my booking requests (tenant)" })
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
    @Param("id") id: string,
    @Body() dto: UpdateBookingStatusDto
  ): Promise<BookingRequest> {
    return this.bookingRequestService.updateStatus(id, dto.status);
  }
}
