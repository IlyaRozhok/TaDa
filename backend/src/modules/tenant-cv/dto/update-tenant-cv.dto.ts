import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { RentHistoryEntry } from "../../../entities/tenant-cv.entity";

class RentHistoryEntryDto implements RentHistoryEntry {
  @ApiPropertyOptional({
    description: "Property name",
    example: "Kings Cross Apartments",
  })
  @IsOptional()
  @IsString()
  property_name: string;

  @ApiPropertyOptional({
    description: "Property address line",
    example: "37 Swinton Street",
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "City or area", example: "London" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: "Monthly rent price", example: 1712 })
  @IsOptional()
  @IsNumber()
  price_per_month?: number;

  @ApiPropertyOptional({ description: "Bedrooms count", example: 1 })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ description: "Bathrooms count", example: 1 })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional({ description: "Size in sqft", example: 497 })
  @IsOptional()
  @IsNumber()
  size_sqft?: number;

  @ApiPropertyOptional({ description: "Property type", example: "apartment" })
  @IsOptional()
  @IsString()
  property_type?: string;

  @ApiPropertyOptional({
    description: "Furnishing description",
    example: "furnished",
  })
  @IsOptional()
  @IsString()
  furnishing?: string;

  @ApiPropertyOptional({ description: "Matching score percent", example: 90 })
  @IsOptional()
  @IsNumber()
  match_score?: number;

  @ApiPropertyOptional({
    description: "Landlord or concierge review",
    example: "Excellent tenant",
  })
  @IsOptional()
  @IsString()
  review?: string;

  @ApiPropertyOptional({
    description: "Landlord/author name",
    example: "King Cross Apartments",
  })
  @IsOptional()
  @IsString()
  landlord?: string;

  @ApiPropertyOptional({ description: "Start date ISO", example: "2021-06-01" })
  @IsOptional()
  @IsString()
  period_from?: string;

  @ApiPropertyOptional({
    description: "End date ISO or null",
    example: "2024-03-01",
  })
  @IsOptional()
  @IsString()
  period_to?: string | null;

  @ApiPropertyOptional({
    description: "Optional media preview URL",
    example: "https://...",
  })
  @IsOptional()
  @IsString()
  media_url?: string;
}

export class UpdateTenantCvDto {
  @ApiPropertyOptional({
    description:
      "Custom headline for CV (e.g., Ready to move - Long term 6+ m)",
  })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({
    description: "About me text to show on the CV",
  })
  @IsOptional()
  @IsString()
  about_me?: string;

  @ApiPropertyOptional({
    description: "Custom hobbies list (overrides preferences.hobbies on CV)",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hobbies?: string[];

  @ApiPropertyOptional({
    description: "Rent history entries to display on CV",
    type: [RentHistoryEntryDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RentHistoryEntryDto)
  rent_history?: RentHistoryEntryDto[];

  @ApiPropertyOptional({
    description: "KYC status badge",
    example: "in_progress",
  })
  @IsOptional()
  @IsString()
  kyc_status?: string;

  @ApiPropertyOptional({
    description: "Referencing status badge",
    example: "pending",
  })
  @IsOptional()
  @IsString()
  referencing_status?: string;

  @ApiPropertyOptional({
    description: "Optional existing share UUID to preserve (ignored on update)",
  })
  @IsOptional()
  @IsUUID()
  share_uuid?: string;
}
