import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsArray,
  IsBoolean,
} from "class-validator";

export class CreatePropertyDto {
  // REQUIRED FIELDS
  @ApiProperty({
    description: "Property title",
    example: "Modern 2BR Apartment",
    required: true,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Building ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: true,
  })
  @IsUUID()
  building_id: string;

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
}
