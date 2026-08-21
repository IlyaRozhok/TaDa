import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

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

  @ApiPropertyOptional({ enum: ["Operator", "Tenant", "Website"] })
  @IsOptional()
  @IsIn(["Operator", "Tenant", "Website"])
  source?: string;
}
