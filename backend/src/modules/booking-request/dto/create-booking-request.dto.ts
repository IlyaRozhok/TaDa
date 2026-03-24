import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";

export class CreateBookingRequestDto {
  @ApiProperty({ description: "Property ID being requested" })
  @IsUUID()
  property_id: string;

  @ApiPropertyOptional({ description: "Contact email from the form" })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @ApiPropertyOptional({ description: "Contact phone from the form" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone_number?: string;

  @ApiPropertyOptional({ description: "Preferred date from (YYYY-MM-DD)" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date_from must be YYYY-MM-DD" })
  date_from?: string;

  @ApiPropertyOptional({ description: "Preferred date to (YYYY-MM-DD)" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date_to must be YYYY-MM-DD" })
  date_to?: string;

  @ApiPropertyOptional({ description: "Additional booking description" })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;
}
