import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateBookingRequestDto {
  @ApiProperty({ description: "Property ID being requested" })
  @IsUUID()
  property_id: string;
}
