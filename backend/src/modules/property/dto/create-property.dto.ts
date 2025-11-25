import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, IsNumber, IsDateString, IsEnum } from "class-validator";
import {
  PropertyType,
  BuildingType,
  Furnishing,
  LetDuration,
  Bills,
} from "../../../entities/property.entity";

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
    description: "Property description",
    example: "Beautiful modern apartment with stunning city views",
    required: true,
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: "Property address",
    example: "123 Main St, London",
    required: true,
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: "Monthly rent price (PCM)",
    example: 2500,
    required: true,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: "Number of bedrooms",
    example: 2,
    required: true,
  })
  @IsNumber()
  bedrooms: number;

  @ApiProperty({
    description: "Number of bathrooms",
    example: 2,
    required: true,
  })
  @IsNumber()
  bathrooms: number;

  @ApiProperty({
    description: "Furnishing type",
    enum: Furnishing,
    example: Furnishing.Furnished,
    required: true,
  })
  @IsEnum(Furnishing)
  furnishing: Furnishing;

  @ApiProperty({
    description: "Available from date",
    example: "2024-03-01",
    required: true,
  })
  @IsDateString()
  available_from: string;

  @ApiProperty({
    description: "Apartment number",
    example: "12A",
    required: true,
  })
  @IsString()
  apartment_number: string;

  @ApiProperty({
    description: "Building ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: true,
  })
  @IsUUID()
  building_id: string;

  // OPTIONAL FIELDS
  @ApiProperty({
    description: "Property description",
    example: "Beautiful modern apartment with stunning city views",
    required: false,
  })
  @IsOptional()
  descriptions?: string;

  @ApiProperty({
    description: "Deposit amount",
    example: 2500,
    required: false,
  })
  @IsOptional()
  deposit?: number;

  @ApiProperty({
    description: "Bills (energy, Wi-Fi, water, council tax)",
    enum: Bills,
    example: Bills.Included,
    required: false,
  })
  @IsOptional()
  bills?: Bills;

  @ApiProperty({
    description: "Property type",
    enum: PropertyType,
    example: PropertyType.Apartment,
    required: false,
  })
  @IsOptional()
  property_type?: PropertyType;


  @ApiProperty({
    description: "Building type",
    enum: BuildingType,
    example: BuildingType.BTR,
    required: false,
  })
  @IsOptional()
  building_type?: BuildingType;


  @ApiProperty({
    description: "Let duration",
    enum: LetDuration,
    example: LetDuration.LongTerm,
    required: false,
  })
  @IsOptional()
  let_duration?: LetDuration;

  @ApiProperty({
    description: "Floor number",
    example: 5,
    required: false,
  })
  @IsOptional()
  floor?: number;

  @ApiProperty({
    description: "Has outdoor space",
    example: true,
    required: false,
  })
  @IsOptional()
  outdoor_space?: boolean;

  @ApiProperty({
    description: "Has balcony",
    example: true,
    required: false,
  })
  @IsOptional()
  balcony?: boolean;

  @ApiProperty({
    description: "Has terrace",
    example: false,
    required: false,
  })
  @IsOptional()
  terrace?: boolean;

  @ApiProperty({
    description: "Square meters",
    example: 65.5,
    required: false,
  })
  @IsOptional()
  square_meters?: number;

  @ApiProperty({
    description: "Property photos URLs (S3)",
    example: [
      "https://s3.amazonaws.com/bucket/photo1.jpg",
      "https://s3.amazonaws.com/bucket/photo2.jpg",
    ],
    type: [String],
    required: false,
  })
  @IsOptional()
  photos?: string[];

  @ApiProperty({
    description: "Property video URL (S3)",
    example: "https://s3.amazonaws.com/bucket/video.mp4",
    required: false,
  })
  @IsOptional()
  video?: string;

  @ApiProperty({
    description: "Property documents URL (S3)",
    example: "https://s3.amazonaws.com/bucket/document.pdf",
    required: false,
  })
  @IsOptional()
  documents?: string;
}

