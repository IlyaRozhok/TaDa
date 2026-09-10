import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDefined,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  ValidateIf,
  ValidateNested,
} from "class-validator";

import {
  CALL_REASON_SLUGS,
  CALL_REQUEST_SOURCES,
  CONTACT_METHOD_SLUGS,
  EMAIL_CONTACT_METHOD,
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
 * payload can aim our sender at an arbitrary inbox. `email` below is the
 * visitor's own address, stored and shown to support; it never becomes a
 * recipient.
 *
 * `contactMethod` decides which contact field the body must carry: exactly one
 * of `phone` or `email` is validated, mirroring the form, which shows exactly
 * one of them. The unused one is ignored rather than rejected — a client that
 * leaves a stale value behind when the visitor switches method should not get
 * a 400 for a field nobody will read.
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

  @ApiProperty({ enum: CONTACT_METHOD_SLUGS, example: "voice_call" })
  @IsIn(CONTACT_METHOD_SLUGS)
  contactMethod: string;

  /**
   * Required for `voice_call` and `video_call`, ignored for `email`.
   * `@IsDefined` is explicit because `@ValidateNested` alone passes an absent
   * value through.
   */
  @ApiPropertyOptional({
    type: CallRequestPhoneDto,
    description: "Required unless contactMethod is 'email'.",
  })
  @ValidateIf((dto: CreateCallRequestDto) => dto.contactMethod !== EMAIL_CONTACT_METHOD)
  @IsDefined()
  @ValidateNested()
  @Type(() => CallRequestPhoneDto)
  phone?: CallRequestPhoneDto;

  /** The visitor's own address. Required for `email`, ignored otherwise. */
  @ApiPropertyOptional({
    example: "jane@example.com",
    description: "Required when contactMethod is 'email'.",
  })
  @ValidateIf((dto: CreateCallRequestDto) => dto.contactMethod === EMAIL_CONTACT_METHOD)
  @IsDefined()
  @IsEmail()
  @MaxLength(254)
  email?: string;

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
