import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { BookingRequestStatus } from "@/entities/booking-request.entity";

/**
 * Query params for the admin list. Unvalidated, a garbage `?status=` used to
 * reach the enum column and surface as a Postgres 22P02 -> 500.
 */
export class FindBookingRequestsDto {
  @ApiPropertyOptional({
    description: "Filter by pipeline status",
    enum: BookingRequestStatus,
  })
  @IsOptional()
  @IsEnum(BookingRequestStatus)
  status?: BookingRequestStatus;
}

/** Query params for the tenant's own list. */
export class FindMyBookingRequestsDto {
  @ApiPropertyOptional({ description: "Filter by property id" })
  @IsOptional()
  @IsUUID()
  property_id?: string;
}
