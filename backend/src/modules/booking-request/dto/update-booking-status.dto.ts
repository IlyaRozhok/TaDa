import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { BookingRequestStatus } from "../../../entities/booking-request.entity";

export class UpdateBookingStatusDto {
  @ApiProperty({
    description: "New status for the booking request",
    enum: BookingRequestStatus,
  })
  @IsEnum(BookingRequestStatus)
  status: BookingRequestStatus;
}
