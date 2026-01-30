import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsIn,
  IsArray,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Pet, PetType, PetSize } from "../../../entities/building.entity";

// Pet DTO matching Property.pets structure
class PetDto implements Pet {
  @IsString()
  @IsIn(["dog", "cat", "other"])
  type: PetType;

  @IsOptional()
  @IsString()
  customType?: string;

  @IsOptional()
  @IsString()
  @IsIn(["small", "medium", "large"])
  size?: PetSize;
}

export class CreatePreferencesDto {
  // ==================== LIFESTYLE PREFERENCES (NEW STEP BEFORE LOCATION) ====================

  @ApiPropertyOptional({
    description: "User occupation/professional status",
    example: "young-professional",
    enum: [
      "student",
      "young-professional",
      "freelancer-remote-worker",
      "business-owner",
      "family-professional",
      "other",
    ],
  })
  @IsOptional()
  @IsIn([
    "student",
    "young-professional",
    "freelancer-remote-worker",
    "business-owner",
    "family-professional",
    "other",
    "",
    null,
  ])
  occupation?: string;

  @ApiPropertyOptional({
    description: "Family status - who will live in the property",
    example: "couple",
    enum: [
      "just-me",
      "couple",
      "couple-with-children",
      "single-parent",
      "friends-flatmates",
    ],
  })
  @IsOptional()
  @IsIn([
    "just-me",
    "couple",
    "couple-with-children",
    "single-parent",
    "friends-flatmates",
    "",
    null,
  ])
  family_status?: string;

  @ApiPropertyOptional({
    description: "Number of children",
    example: "no",
    enum: ["no", "yes-1-child", "yes-2-children", "yes-3-plus-children"],
  })
  @IsOptional()
  @IsIn([
    "no",
    "yes-1-child",
    "yes-2-children",
    "yes-3-plus-children",
    "",
    null,
  ])
  children_count?: string;

  // ==================== KYC & REFERENCING ====================

  @ApiPropertyOptional({
    description: "KYC status badge",
    example: "pending",
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

  // ==================== STEP 1: LOCATION ====================

  @ApiPropertyOptional({
    description: "Preferred areas (London regions)",
    example: ["West", "East"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_areas?: string[];

  @ApiPropertyOptional({
    description: "Preferred districts/boroughs",
    example: ["Camden", "Westminster"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_districts?: string[];

  @ApiPropertyOptional({
    description: "Preferred address/area (free text)",
    example: "Central London",
  })
  @IsOptional()
  @IsString()
  preferred_address?: string;

  @ApiPropertyOptional({
    description: "Preferred metro stations (labels)",
    example: ["Central London", "King's Cross", "Oxford Circus"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_metro_stations?: string[];

  // ==================== STEP 2: BUDGET & MOVE-IN ====================

  @ApiPropertyOptional({
    description: "Preferred move-in date",
    example: "2024-03-01",
  })
  @IsOptional()
  @IsDateString()
  move_in_date?: string;

  @ApiPropertyOptional({
    description: "Preferred move-out date",
    example: "2024-09-01",
  })
  @IsOptional()
  @IsDateString()
  move_out_date?: string;

  @ApiPropertyOptional({
    description: "Minimum rent price per month",
    example: 1500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({
    description: "Maximum rent price per month",
    example: 3000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({
    description:
      "Whether budget is flexible (tenant open to different price range)",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  flexible_budget?: boolean;

  @ApiPropertyOptional({
    description: "Deposit preference",
    example: "yes",
    enum: ["yes", "no"],
  })
  @IsOptional()
  @IsIn(["yes", "no", "", null])
  deposit_preference?: string;

  // ==================== STEP 3: PROPERTY & ROOMS ====================

  @ApiPropertyOptional({
    description: "Preferred property types (matches Property.property_type)",
    example: ["apartment", "flat", "studio"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  property_types?: string[];

  @ApiPropertyOptional({
    description: "Preferred number of bedrooms",
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  bedrooms?: number[];

  @ApiPropertyOptional({
    description: "Preferred number of bathrooms",
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  bathrooms?: number[];

  @ApiPropertyOptional({
    description: "Preferred furnishing types",
    example: ["furnished", "part-furnished"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  furnishing?: string[];

  @ApiPropertyOptional({
    description: "Whether outdoor space is preferred",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  outdoor_space?: boolean;

  @ApiPropertyOptional({
    description: "Whether balcony is preferred",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  balcony?: boolean;

  @ApiPropertyOptional({
    description: "Whether terrace is preferred",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  terrace?: boolean;

  @ApiPropertyOptional({
    description: "Minimum square meters",
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_square_meters?: number;

  @ApiPropertyOptional({
    description: "Maximum square meters",
    example: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_square_meters?: number;

  // ==================== STEP 4: BUILDING & DURATION ====================

  @ApiPropertyOptional({
    description: "Preferred building types",
    example: ["btr", "co-living"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  building_types?: string[];

  @ApiPropertyOptional({
    description: "Preferred let duration",
    example: "long_term",
  })
  @IsOptional()
  @IsString()
  let_duration?: string;

  @ApiPropertyOptional({
    description: "Bills preference",
    example: "included",
  })
  @IsOptional()
  @IsString()
  bills?: string;

  // ==================== STEP 5: TENANT TYPE ====================

  @ApiPropertyOptional({
    description: "Tenant types",
    example: ["family", "sharers"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenant_types?: string[];

  // ==================== STEP 6: PETS ====================

  @ApiPropertyOptional({
    description: "Whether tenant needs pet-friendly property",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  pet_policy?: boolean;

  @ApiPropertyOptional({
    description: "Tenant's pets (matches Property.pets structure)",
    example: [{ type: "dog", size: "small" }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetDto)
  pets?: PetDto[];

  @ApiPropertyOptional({
    description: "Number of pets",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  number_of_pets?: number;

  // ==================== STEP 7: AMENITIES ====================

  @ApiPropertyOptional({
    description: "Preferred amenities",
    example: ["Gym", "Co-working", "Parking"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: "Whether concierge is preferred",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_concierge?: boolean;

  @ApiPropertyOptional({
    description: "Whether smoking area is preferred",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  smoking_area?: boolean;

  // ==================== STEP 8: HOBBIES ====================

  @ApiPropertyOptional({
    description: "User's hobbies and interests",
    example: ["Reading", "Cooking", "Fitness"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hobbies?: string[];

  // ==================== STEP 9: LIVING ENVIRONMENT ====================

  @ApiPropertyOptional({
    description: "Ideal living environment preferences",
    example: ["quiet-professional", "social-friendly"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ideal_living_environment?: string[];

  @ApiPropertyOptional({
    description: "Smoking preference",
    example: "no",
    enum: [
      "no",
      "yes",
      "no-but-okay",
      "no-prefer-non-smoking",
      "no-preference",
    ],
  })
  @IsOptional()
  @IsIn([
    "no",
    "yes",
    "no-but-okay",
    "no-prefer-non-smoking",
    "no-preference",
    "",
    null,
  ])
  smoker?: string;

  // ==================== STEP 10: ABOUT YOU ====================

  @ApiPropertyOptional({
    description: "Additional information about the user",
    example: "I'm a quiet professional who enjoys cooking and reading.",
  })
  @IsOptional()
  @IsString()
  additional_info?: string;

  // ==================== LEGACY FIELDS (for backward compatibility) ====================

  @ApiPropertyOptional({ description: "Primary postcode (legacy)" })
  @IsOptional()
  @IsString()
  primary_postcode?: string;

  @ApiPropertyOptional({ description: "Secondary location (legacy)" })
  @IsOptional()
  @IsString()
  secondary_location?: string;

  @ApiPropertyOptional({ description: "Commute location (legacy)" })
  @IsOptional()
  @IsString()
  commute_location?: string;

  @ApiPropertyOptional({ description: "Commute time walk (legacy)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  commute_time_walk?: number;

  @ApiPropertyOptional({ description: "Commute time cycle (legacy)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  commute_time_cycle?: number;

  @ApiPropertyOptional({ description: "Commute time tube (legacy)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  commute_time_tube?: number;

  @ApiPropertyOptional({ description: "Min bedrooms (legacy)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  min_bedrooms?: number;

  @ApiPropertyOptional({ description: "Max bedrooms (legacy)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  max_bedrooms?: number;

  @ApiPropertyOptional({ description: "Min bathrooms (legacy)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  min_bathrooms?: number;

  @ApiPropertyOptional({ description: "Max bathrooms (legacy)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  max_bathrooms?: number;

  @ApiPropertyOptional({ description: "Property type array (legacy)" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  property_type?: string[];

  @ApiPropertyOptional({ description: "Building style (legacy)" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  building_style?: string[];

  @ApiPropertyOptional({ description: "Designer furniture (legacy)" })
  @IsOptional()
  @IsBoolean()
  designer_furniture?: boolean;

  @ApiPropertyOptional({ description: "House shares (legacy)" })
  @IsOptional()
  @IsString()
  house_shares?: string;

  @ApiPropertyOptional({ description: "Date property added (legacy)" })
  @IsOptional()
  @IsString()
  date_property_added?: string;

  @ApiPropertyOptional({ description: "Lifestyle features (legacy)" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lifestyle_features?: string[];

  @ApiPropertyOptional({ description: "Social features (legacy)" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  social_features?: string[];

  @ApiPropertyOptional({ description: "Work features (legacy)" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  work_features?: string[];

  @ApiPropertyOptional({ description: "Convenience features (legacy)" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  convenience_features?: string[];

  @ApiPropertyOptional({ description: "Pet friendly features (legacy)" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pet_friendly_features?: string[];

  @ApiPropertyOptional({ description: "Luxury features (legacy)" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  luxury_features?: string[];
}
