import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

class MetroStationDto {
  @IsString()
  label: string;
  @IsNumber()
  destination: number;
}

class CommuteTimeDto {
  @IsString()
  label: string;
  @IsNumber()
  destination: number;
}

class LocalEssentialDto {
  @IsString()
  label: string;
  @IsNumber()
  destination: number;
}

class ConciergeHoursDto {
  @IsNumber()
  from: number;
  @IsNumber()
  to: number;
}

class PetDto {
  @IsString()
  type: "dog" | "cat" | "other";
  @IsOptional()
  @IsString()
  customType?: string;
  @IsOptional()
  @IsString()
  size?: "small" | "medium" | "large";
}

export class CreatePropertyDto {
  // REQUIRED FIELDS
  @ApiProperty({
    description: "Property title",
    example: "Modern 2BR Apartment",
    required: true,
  })
  @IsNotEmpty({ message: "Title is required" })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Building ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  building_id?: string;

  @ApiProperty({
    description: "Operator ID (required for private landlord properties)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  // OPTIONAL FIELDS
  @ApiProperty({
    description: "Apartment number",
    example: "12A",
    required: false,
  })
  @IsOptional()
  @IsString()
  apartment_number?: string;

  @ApiProperty({
    description: "Property descriptions",
    example: "Beautiful modern apartment",
    required: false,
  })
  @IsOptional()
  @IsString()
  descriptions?: string;

  @ApiProperty({
    description: "Property type",
    example: "apartment",
    enum: ["apartment", "house", "studio", "penthouse", "duplex"],
    required: false,
  })
  @IsOptional()
  @IsString()
  property_type?: string;

  @ApiProperty({
    description: "Furnishing level",
    example: "furnished",
    enum: ["furnished", "unfurnished", "partially_furnished"],
    required: false,
  })
  @IsOptional()
  @IsString()
  furnishing?: string;

  @ApiProperty({
    description: "Bills included",
    example: "included",
    enum: ["included", "excluded", "some_included"],
    required: false,
  })
  @IsOptional()
  @IsString()
  bills?: string;

  @ApiProperty({
    description: "Available from date",
    example: "2024-01-15",
    required: false,
  })
  @IsOptional()
  @IsString()
  available_from?: string;

  @ApiProperty({
    description: "Building type",
    example: "residential",
    enum: ["residential", "commercial", "mixed"],
    required: false,
  })
  @IsOptional()
  @IsString()
  building_type?: string;

  @ApiProperty({
    description: "Whether the property is luxury",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  luxury?: boolean;

  // Inherited fields from building
  @ApiProperty({
    description: "Property address (inherited from building or custom)",
    example: "123 Main St, London",
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description:
      "Tenant types for this property (inherited from building or custom)",
    example: ["family", "student"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenant_types?: string[];

  @ApiProperty({
    description: "Property amenities (inherited from building or custom)",
    example: ["Parking", "Garden", "Gym"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({
    description:
      "Whether property has concierge (inherited from building or custom)",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_concierge?: boolean;

  @ApiProperty({
    description: "Pet policy (inherited from building or custom)",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  pet_policy?: boolean;

  @ApiProperty({
    description:
      "Smoking area availability (inherited from building or custom)",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  smoking_area?: boolean;

  @ApiProperty({
    description:
      "Metro stations with travel times (inherited from building or custom)",
    example: [{ label: "Oxford Circus", destination: 5 }],
    type: [MetroStationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetroStationDto)
  metro_stations?: MetroStationDto[];

  @ApiProperty({
    description:
      "Commute times to popular destinations (inherited from building or custom)",
    example: [{ label: "City Centre", destination: 15 }],
    type: [CommuteTimeDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommuteTimeDto)
  commute_times?: CommuteTimeDto[];

  @ApiProperty({
    description:
      "Local essentials with distances (inherited from building or custom)",
    example: [{ label: "Tesco Express", destination: 200 }],
    type: [LocalEssentialDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocalEssentialDto)
  local_essentials?: LocalEssentialDto[];

  @ApiProperty({
    description:
      "Concierge operating hours (inherited from building or custom)",
    example: { from: 8, to: 22 },
    type: ConciergeHoursDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConciergeHoursDto)
  concierge_hours?: ConciergeHoursDto;

  @ApiProperty({
    description:
      "Allowed pet types and sizes (inherited from building or custom)",
    example: [{ type: "dog", size: "small" }],
    type: [PetDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetDto)
  pets?: PetDto[];

  @ApiProperty({
    description: "Let duration",
    example: "12 months",
    required: false,
  })
  @IsOptional()
  @IsString()
  let_duration?: string;

  @ApiProperty({
    description: "Floor number",
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiProperty({
    description: "Square meters",
    example: 75.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  square_meters?: number;

  @ApiProperty({
    description: "Has outdoor space",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  outdoor_space?: boolean;

  @ApiProperty({
    description: "Has balcony",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  balcony?: boolean;

  @ApiProperty({
    description: "Has terrace",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  terrace?: boolean;

  @ApiProperty({
    description: "Monthly rent price (PCM)",
    example: 2500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: "Security deposit",
    example: 2500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  deposit?: number;

  @ApiProperty({
    description: "Number of bedrooms",
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiProperty({
    description: "Number of bathrooms",
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiProperty({
    description: "Property photos URLs",
    example: ["https://s3.amazonaws.com/bucket/photo1.jpg"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty({
    description: "Property video URL",
    example: "https://s3.amazonaws.com/bucket/video.mp4",
    required: false,
  })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiProperty({
    description: "Property documents URL",
    example: "https://s3.amazonaws.com/bucket/document.pdf",
    required: false,
  })
  @IsOptional()
  @IsString()
  documents?: string;
}
