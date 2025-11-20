import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsBoolean,
  IsEnum,
  IsUUID,
  ValidateIf,
  ValidateNested,
  ArrayMinSize,
  IsObject,
  Min,
  Max,
  Matches,
  Validate,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";
import { UnitType, TenantType, Pet } from "../../../entities/building.entity";

// Custom validator for HTTPS URLs
function IsHttpsUrl(validationOptions?: any) {
  return Validate(
    (value: string) => {
      if (!value) return true; // Allow empty values
      return /^https:\/\/.+/.test(value);
    },
    {
      message: "URL must be a valid HTTPS URL",
      ...validationOptions,
    }
  );
}

export class MetroStationDto {
  @ApiProperty({ description: "Metro station name", example: "Oxford Circus" })
  @IsString()
  label: string;

  @ApiProperty({
    description: "Time to metro station in minutes",
    example: 5,
  })
  @IsInt()
  @Min(0)
  destination: number;
}

export class CommuteTimeDto {
  @ApiProperty({ description: "Destination name", example: "City Centre" })
  @IsString()
  label: string;

  @ApiProperty({ description: "Commute time in minutes", example: 15 })
  @IsInt()
  @Min(0)
  destination: number;
}

export class LocalEssentialDto {
  @ApiProperty({
    description: "Local essential name",
    example: "Tesco Express",
  })
  @IsString()
  label: string;

  @ApiProperty({ description: "Distance in meters", example: 200 })
  @IsInt()
  @Min(0)
  destination: number;
}

export class ConciergeHoursDto {
  @ApiProperty({ description: "Opening hour (0-23)", example: 8 })
  @IsInt()
  @Min(0)
  @Max(23)
  from: number;

  @ApiProperty({ description: "Closing hour (0-23)", example: 22 })
  @IsInt()
  @Min(0)
  @Max(23)
  to: number;
}

export class PetDto {
  @ApiProperty({
    description: "Pet type",
    example: "dog",
    enum: ["dog", "cat", "other"],
  })
  @IsEnum(["dog", "cat", "other"])
  type: "dog" | "cat" | "other";

  @ApiProperty({
    description: "Custom pet type name (required when type is 'other')",
    example: "Hamster",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "Custom pet type name is required when type is 'other'" })
  customType?: string;

  @ApiProperty({
    description: "Pet size (optional for all types, recommended for dogs and cats)",
    example: "small",
    enum: ["small", "medium", "large"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["small", "medium", "large"])
  size?: "small" | "medium" | "large";
}

export class CreateBuildingDto {
  // REQUIRED FIELDS
  @ApiProperty({
    description: "Name of the building",
    example: "Sunset Gardens",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Operator ID who manages this building",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.operator_id !== null && o.operator_id !== undefined)
  @IsUUID(undefined, { message: "operator_id must be a valid UUID" })
  operator_id?: string | null;

  // OPTIONAL FIELDS
  @ApiProperty({
    description: "Address of the building",
    example: "123 Sunset Boulevard, London, SW1A 1AA",
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: "Total number of units in the building",
    example: 150,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  number_of_units?: number;

  @ApiProperty({
    description: "Type of units in the building",
    example: "2-bed",
    enum: ["studio", "1-bed", "2-bed", "3-bed", "Duplex", "penthouse"],
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.type_of_unit !== "" && o.type_of_unit !== null && o.type_of_unit !== undefined)
  @IsEnum(["studio", "1-bed", "2-bed", "3-bed", "Duplex", "penthouse"])
  type_of_unit?: UnitType;

  @ApiProperty({
    description: "Logo URL (S3)",
    example: "https://s3.amazonaws.com/bucket/logo.jpg",
    required: false,
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({
    description: "Video URL (S3)",
    example: "https://s3.amazonaws.com/bucket/video.mp4",
    required: false,
  })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiProperty({
    description: "Array of photo URLs",
    example: [
      "https://s3.amazonaws.com/bucket/photo1.jpg",
      "https://s3.amazonaws.com/bucket/photo2.jpg",
      "https://s3.amazonaws.com/bucket/photo3.jpg",
    ],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty({
    description: "Document URL (PDF, S3)",
    example: "https://s3.amazonaws.com/bucket/document.pdf",
    required: false,
  })
  @IsOptional()
  @IsString()
  documents?: string;

  @ApiProperty({
    description: "Metro stations with travel times",
    type: [MetroStationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetroStationDto)
  metro_stations?: MetroStationDto[];

  @ApiProperty({
    description: "Commute times to popular destinations",
    type: [CommuteTimeDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommuteTimeDto)
  commute_times?: CommuteTimeDto[];

  @ApiProperty({
    description: "Local essentials with distances",
    type: [LocalEssentialDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocalEssentialDto)
  local_essentials?: LocalEssentialDto[];

  @ApiProperty({
    description: "Building amenities",
    example: ["Co-working", "Parking", "Garden"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({
    description: "Whether building has concierge service",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_concierge?: boolean;

  @ApiProperty({
    description: "Concierge operating hours (if available)",
    type: ConciergeHoursDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConciergeHoursDto)
  concierge_hours?: ConciergeHoursDto | null;

  @ApiProperty({
    description: "Pet policy - are pets allowed",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  pet_policy?: boolean;

  @ApiProperty({
    description: "Allowed pet types and sizes",
    type: [PetDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetDto)
  pets?: PetDto[] | null;

  @ApiProperty({
    description: "Whether building has smoking area",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  smoking_area?: boolean;

  @ApiProperty({
    description: "Type of tenants the building is designed for",
    example: "family",
    enum: ["corporateLets", "sharers", "student", "family", "elder"],
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.tenant_type !== "" && o.tenant_type !== null && o.tenant_type !== undefined)
  @IsEnum(["corporateLets", "sharers", "student", "family", "elder"])
  tenant_type?: TenantType;
}
