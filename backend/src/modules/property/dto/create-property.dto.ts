import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, IsNumber, IsArray } from "class-validator";

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
    description: "Property description",
    example: "Beautiful modern apartment",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Monthly rent price (PCM)",
    example: 2500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

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

