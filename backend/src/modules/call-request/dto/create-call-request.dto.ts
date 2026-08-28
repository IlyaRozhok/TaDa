import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  ValidateNested,
} from "class-validator";

import {
  CALL_REASON_SLUGS,
  CALL_REQUEST_SOURCES,
} from "../call-request.vocabulary";

export class CallRequestPhoneDto {
  @ApiProperty({ example: "GB", description: "ISO 3166-1 alpha-2 country code" })
  @Matches(/^[A-Z]{2}$/, {
    message: "countryCode must be a two-letter uppercase ISO country code",
  })
  countryCode: string;

  @ApiProperty({ example: "20 7946 0000" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  number: string;
}

/**
 * Body of the public "Book a call" endpoint. Every field is untrusted input
 * from an unauthenticated form: lengths are capped so nobody can mail the
 * support inbox a megabyte, and `reason` and `source` are closed lists rather
 * than free text.
 *
 * There is deliberately no recipient field. The destination is resolved by the
 * email channel from config — invariant 2 of NotificationsService — so no
 * payload can aim our sender at an arbitrary inbox.
 */
export class CreateCallRequestDto {
  @ApiProperty({ enum: CALL_REASON_SLUGS, example: "looking_for_home" })
  @IsIn(CALL_REASON_SLUGS)
  reason: string;

  @ApiProperty({ example: "Jane Doe" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ type: CallRequestPhoneDto })
  @ValidateNested()
  @Type(() => CallRequestPhoneDto)
  phone: CallRequestPhoneDto;

  @ApiPropertyOptional({
    example: "Weekday evenings after 6pm",
    description:
      "Free text: when the visitor would like to be called, in their own words.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredTime?: string;

  @ApiPropertyOptional({ example: "Evenings after 6pm work best." })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ enum: CALL_REQUEST_SOURCES, example: "tenant" })
  @IsIn(CALL_REQUEST_SOURCES)
  source: (typeof CALL_REQUEST_SOURCES)[number];
}
