import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * Body of the public demo-request endpoint. Every field is untrusted input
 * from an unauthenticated form: lengths are capped so nobody can mail the
 * support inbox a megabyte, and `source` is a closed list.
 */
export class CreateDemoRequestDto {
  @ApiProperty({ example: "Jane" })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: "jane@example.com" })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: "+44 20 7946 0000" })
  @IsString()
  @MaxLength(32)
  phone: string;

  @ApiPropertyOptional({
    description:
      'Which surface sent the form, e.g. "Tenant", "Operator Request Demo", "Operator Spotlight Series". Free text (capped) because the landing keeps growing new entry points; the value is only ever printed into the internal email.',
    example: "Tenant",
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}
