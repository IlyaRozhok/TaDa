import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { Pet } from "./building.entity";

// Reuse enums from Property for compatibility
export enum PropertyType {
  APARTMENT = "apartment",
  HOUSE = "house",
  STUDIO = "studio",
  PENTHOUSE = "penthouse",
  DUPLEX = "duplex",
  FLAT = "flat",
  ROOM = "room",
}

export enum Furnishing {
  FURNISHED = "furnished",
  UNFURNISHED = "unfurnished",
  PARTIALLY_FURNISHED = "partially_furnished",
  PART_FURNISHED = "part-furnished",
}

export enum Bills {
  INCLUDED = "included",
  EXCLUDED = "excluded",
  SOME_INCLUDED = "some_included",
}

export enum BuildingType {
  BTR = "btr",
  CO_LIVING = "co-living",
  PROFESSIONAL_MANAGEMENT = "professional_management",
  RESIDENTIAL = "residential",
  COMMERCIAL = "commercial",
  MIXED = "mixed",
}

export enum LetDuration {
  SHORT_TERM = "short_term",
  LONG_TERM = "long_term",
  FLEXIBLE = "flexible",
  SIX_MONTHS = "6_months",
  TWELVE_MONTHS = "12_months",
}

export enum TenantType {
  CORPORATE_LETS = "corporateLets",
  SHARERS = "sharers",
  STUDENT = "student",
  FAMILY = "family",
  ELDER = "elder",
}

export enum SmokingPreference {
  NO = "no",
  YES = "yes",
  NO_BUT_OKAY = "no-but-okay",
  NO_PREFER_NON_SMOKING = "no-prefer-non-smoking",
  NO_PREFERENCE = "no-preference",
}

export enum IdealLivingEnvironment {
  QUIET_PROFESSIONAL = "quiet-professional",
  SOCIAL_FRIENDLY = "social-friendly",
  FAMILY_ORIENTED = "family-oriented",
  STUDENT_LIFESTYLE = "student-lifestyle",
  CREATIVE_ARTISTIC = "creative-artistic",
}

@Entity("preferences")
export class Preferences {
  @ApiProperty({ description: "Unique preferences identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "User ID who owns these preferences" })
  @Column("uuid")
  user_id: string;

  // ==================== STEP 1: LOCATION ====================

  @ApiProperty({
    description: "Preferred address/area (free text)",
    example: "Central London",
    required: false,
  })
  @Column({ nullable: true })
  preferred_address?: string;

  @ApiProperty({
    description: "Preferred areas (London regions)",
    example: ["West", "East"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  preferred_areas?: string[];

  @ApiProperty({
    description: "Preferred districts/boroughs",
    example: ["Camden", "Westminster"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  preferred_districts?: string[];

  @ApiProperty({
    description: "Preferred metro stations (labels)",
    example: ["Central London", "King's Cross", "Oxford Circus"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  preferred_metro_stations?: string[];

  // ==================== STEP 2: BUDGET & MOVE-IN ====================

  @ApiProperty({
    description: "Preferred move-in date",
    example: "2024-03-01",
    required: false,
  })
  @Column({ type: "date", nullable: true })
  move_in_date?: Date;

  @ApiProperty({
    description: "Preferred move-out date",
    example: "2024-09-01",
    required: false,
  })
  @Column({ type: "date", nullable: true })
  move_out_date?: Date;

  @ApiProperty({
    description: "Minimum rent price per month (matches Property.price)",
    example: 1500,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  min_price?: number;

  @ApiProperty({
    description: "Maximum rent price per month (matches Property.price)",
    example: 3000,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  max_price?: number;

  @ApiProperty({
    description: "Deposit preference - whether tenant accepts deposit",
    example: "yes",
    enum: ["yes", "no"],
    required: false,
  })
  @Column({ nullable: true })
  deposit_preference?: string;

  // ==================== STEP 3: PROPERTY & ROOMS ====================

  @ApiProperty({
    description: "Preferred property types (matches Property.property_type)",
    example: ["apartment", "flat", "studio"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  property_types?: string[];

  @ApiProperty({
    description: "Preferred number of bedrooms (matches Property.bedrooms)",
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  bedrooms?: number[];

  @ApiProperty({
    description: "Preferred number of bathrooms (matches Property.bathrooms)",
    example: [1, 2],
    type: [Number],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  bathrooms?: number[];

  @ApiProperty({
    description: "Preferred furnishing types (matches Property.furnishing)",
    example: ["furnished", "part-furnished"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  furnishing?: string[];

  @ApiProperty({
    description:
      "Whether outdoor space is preferred (matches Property.outdoor_space)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  outdoor_space?: boolean;

  @ApiProperty({
    description: "Whether balcony is preferred (matches Property.balcony)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  balcony?: boolean;

  @ApiProperty({
    description: "Whether terrace is preferred (matches Property.terrace)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  terrace?: boolean;

  @ApiProperty({
    description: "Minimum square meters (matches Property.square_meters)",
    example: 15,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  min_square_meters?: number;

  @ApiProperty({
    description: "Maximum square meters (matches Property.square_meters)",
    example: 100,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  max_square_meters?: number;

  // ==================== STEP 4: BUILDING & DURATION ====================

  @ApiProperty({
    description: "Preferred building types (matches Property.building_type)",
    example: ["btr", "co-living"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  building_types?: string[];

  @ApiProperty({
    description: "Preferred let duration (matches Property.let_duration)",
    example: "long_term",
    required: false,
  })
  @Column({ nullable: true })
  let_duration?: string;

  @ApiProperty({
    description: "Bills preference (matches Property.bills)",
    example: "included",
    required: false,
  })
  @Column({ nullable: true })
  bills?: string;

  // ==================== STEP 5: TENANT TYPE ====================

  @ApiProperty({
    description: "Tenant types (matches Property.tenant_types)",
    example: ["family", "sharers"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  tenant_types?: string[];

  // ==================== STEP 6: PETS ====================

  @ApiProperty({
    description:
      "Whether tenant needs pet-friendly property (matches Property.pet_policy)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  pet_policy?: boolean;

  @ApiProperty({
    description: "Tenant's pets (matches Property.pets structure)",
    example: [{ type: "dog", size: "small" }],
    type: "json",
    required: false,
  })
  @Column({ type: "jsonb", nullable: true })
  pets?: Pet[];

  @ApiProperty({
    description: "Number of pets",
    example: 1,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  number_of_pets?: number;

  // ==================== STEP 7: AMENITIES ====================

  @ApiProperty({
    description: "Preferred amenities (matches Property.amenities)",
    example: ["Gym", "Co-working", "Parking"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  amenities?: string[];

  @ApiProperty({
    description:
      "Whether concierge is preferred (matches Property.is_concierge)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  is_concierge?: boolean;

  @ApiProperty({
    description:
      "Whether smoking area is preferred (matches Property.smoking_area)",
    example: false,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  smoking_area?: boolean;

  // ==================== STEP 8: HOBBIES ====================

  @ApiProperty({
    description: "User's hobbies and interests",
    example: ["Reading", "Cooking", "Fitness"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  hobbies?: string[];

  // ==================== STEP 9: LIVING ENVIRONMENT ====================

  @ApiProperty({
    description: "Ideal living environment preferences",
    example: ["quiet-professional", "social-friendly"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  ideal_living_environment?: string[];

  @ApiProperty({
    description: "Smoking preference",
    example: "no",
    enum: [
      "no",
      "yes",
      "no-but-okay",
      "no-prefer-non-smoking",
      "no-preference",
    ],
    required: false,
  })
  @Column({ nullable: true })
  smoker?: string;

  // ==================== LIFESTYLE PREFERENCES (NEW STEP BEFORE LOCATION) ====================

  @ApiProperty({
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
    required: false,
  })
  @Column({ nullable: true })
  occupation?: string;

  @ApiProperty({
    description: "Family status - who will live in the property",
    example: "couple",
    enum: [
      "just-me",
      "couple",
      "couple-with-children",
      "single-parent",
      "friends-flatmates",
    ],
    required: false,
  })
  @Column({ nullable: true })
  family_status?: string;

  @ApiProperty({
    description: "Number of children",
    example: "no",
    enum: [
      "no",
      "yes-1-child",
      "yes-2-children",
      "yes-3-plus-children",
    ],
    required: false,
  })
  @Column({ nullable: true })
  children_count?: string;

  // ==================== KYC & REFERENCING ====================

  @ApiProperty({
    description: "KYC status badge",
    example: "pending",
    required: false,
  })
  @Column({ nullable: true })
  kyc_status?: string | null;

  @ApiProperty({
    description: "Referencing status badge",
    example: "pending",
    required: false,
  })
  @Column({ nullable: true })
  referencing_status?: string | null;

  // ==================== STEP 10: ABOUT YOU ====================

  @ApiProperty({
    description: "Additional information about the user",
    example: "I'm a quiet professional who enjoys cooking and reading.",
    required: false,
  })
  @Column({ type: "text", nullable: true })
  additional_info?: string;

  // ==================== LEGACY FIELDS (for backward compatibility) ====================
  // These will be deprecated but kept for migration purposes

  @Column({ nullable: true })
  primary_postcode?: string;

  @Column({ nullable: true })
  secondary_location?: string;

  @Column({ nullable: true })
  commute_location?: string;

  @Column({ type: "int", nullable: true })
  commute_time_walk?: number;

  @Column({ type: "int", nullable: true })
  commute_time_cycle?: number;

  @Column({ type: "int", nullable: true })
  commute_time_tube?: number;

  @Column({ type: "int", nullable: true })
  min_bedrooms?: number;

  @Column({ type: "int", nullable: true })
  max_bedrooms?: number;

  @Column({ type: "int", nullable: true })
  min_bathrooms?: number;

  @Column({ type: "int", nullable: true })
  max_bathrooms?: number;

  @Column({ type: "jsonb", nullable: true, default: [] })
  property_type?: string[];

  @Column({ type: "jsonb", nullable: true, default: [] })
  building_style?: string[];

  @Column({ type: "boolean", nullable: true })
  designer_furniture?: boolean;

  @Column({ nullable: true })
  house_shares?: string;

  @Column({ nullable: true })
  date_property_added?: string;

  @Column({ type: "jsonb", nullable: true, default: [] })
  lifestyle_features?: string[];

  @Column({ type: "jsonb", nullable: true, default: [] })
  social_features?: string[];

  @Column({ type: "jsonb", nullable: true, default: [] })
  work_features?: string[];

  @Column({ type: "jsonb", nullable: true, default: [] })
  convenience_features?: string[];

  @Column({ type: "jsonb", nullable: true, default: [] })
  pet_friendly_features?: string[];

  @Column({ type: "jsonb", nullable: true, default: [] })
  luxury_features?: string[];

  // ==================== TIMESTAMPS ====================

  @ApiProperty({ description: "Preferences creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Preferences last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // ==================== RELATIONS ====================

  @OneToOne(() => User, (user) => user.preferences)
  @JoinColumn({ name: "user_id" })
  user: User;
}
