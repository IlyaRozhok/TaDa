import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

/**
 * Shape checks only. Whether the number is a valid mobile, from an allowed
 * country and free to verify is the service's call, so it can answer with
 * the specific error code the screen branches on.
 */
export class SendPhoneCodeDto {
  @ApiProperty({ description: "Mobile number, national or international", example: "07123 456789" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  phone: string;

  @ApiPropertyOptional({ description: "ISO country the number was typed in", example: "GB" })
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: "country must be a two-letter uppercase ISO code" })
  country?: string;

  @ApiPropertyOptional({ description: "Cloudflare Turnstile token; required once Turnstile is configured" })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstileToken?: string;
}

export class VerifyPhoneCodeDto {
  @ApiProperty({ description: "The number the code was sent to", example: "+447123456789" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  phone: string;

  @ApiPropertyOptional({ description: "ISO country the number was typed in", example: "GB" })
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: "country must be a two-letter uppercase ISO code" })
  country?: string;

  @ApiProperty({ description: "The 6-digit code from the SMS", example: "123456" })
  @Matches(/^\d{6}$/, { message: "Enter the 6-digit code from the SMS" })
  code: string;
}
