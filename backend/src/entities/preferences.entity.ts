import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { Pet } from "./building.entity";

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
  MEDIUM_TERM = "medium_term",
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
  // UNIQUE: exactly one preferences row per user. Without the constraint two
  // concurrent first saves created two rows, and every findOne({ user_id })
  // consumer — matching included — nondeterministically picked one of them.
  @Index("uq_preferences_user_id", { unique: true })
  @Column("uuid")
  user_id: string;

  // ==================== STEP 1: LOCATION ====================

  @ApiProperty({
    description: "Preferred address/area (free text)",
    example: "Central London",
    required: false,
  })
  // Nullable scalar columns are typed `| null` so writes can actually CLEAR
  // them: TypeORM's save()/update() silently skip `undefined` values, which is
  // how "clear preferences" used to leave budget and dates in place (same trap
  // already documented on `property.building_id`).
  @Column({ type: "varchar", nullable: true })
  preferred_address?: string | null;

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
  move_in_date?: Date | null;

  @ApiProperty({
    description: "Preferred move-out date",
    example: "2024-09-01",
    required: false,
  })
  @Column({ type: "date", nullable: true })
  move_out_date?: Date | null;

  @ApiProperty({
    description: "Minimum rent price per month (matches Property.price)",
    example: 1500,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  min_price?: number | null;

  @ApiProperty({
    description: "Maximum rent price per month (matches Property.price)",
    example: 3000,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  max_price?: number | null;

  @ApiProperty({
    description:
      "Whether budget is flexible (tenant open to different price range)",
    example: false,
    required: false,
  })
  @Column({ type: "boolean", nullable: true, default: false })
  flexible_budget?: boolean;

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
    description: "Whether balcony is preferred (matches Property.balcony)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  balcony?: boolean | null;

  @ApiProperty({
    description: "Whether terrace is preferred (matches Property.terrace)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  terrace?: boolean | null;

  @ApiProperty({
    description: "Minimum square meters (matches Property.square_meters)",
    example: 15,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  min_square_meters?: number | null;

  @ApiProperty({
    description: "Maximum square meters (matches Property.square_meters)",
    example: 100,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  max_square_meters?: number | null;

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
  @Column({ type: "varchar", nullable: true })
  let_duration?: string | null;

  @ApiProperty({
    description: "Bills preference (matches Property.bills)",
    example: "included",
    required: false,
  })
  @Column({ type: "varchar", nullable: true })
  bills?: string | null;

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
  pet_policy?: boolean | null;

  @ApiProperty({
    description: "Tenant's pets (matches Property.pets structure)",
    example: [{ type: "dog", size: "small" }],
    type: "json",
    required: false,
  })
  @Column({ type: "jsonb", nullable: true })
  pets?: Pet[] | null;

  @ApiProperty({
    description: "Number of pets",
    example: 1,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  number_of_pets?: number | null;

  // ==================== STEP 7: AMENITIES ====================

  @ApiProperty({
    description: "Preferred amenities (matches Property.amenities)",
    example: ["Gym", "Co-working", "Parking"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  amenities?: string[];

  // ==================== STEP 7b: PROPERTY AMENITIES (apartment-level features) ====================

  @ApiProperty({
    description: "Preferred apartment-level features (kitchen, bathroom, storage, etc.)",
    example: ["Dishwasher", "Rainfall shower", "Fibre broadband"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  property_amenities?: string[];

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
  @Column({ type: "varchar", nullable: true })
  smoker?: string | null;

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
  @Column({ type: "varchar", nullable: true })
  occupation?: string | null;

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
  @Column({ type: "varchar", nullable: true })
  family_status?: string | null;

  @ApiProperty({
    description: "Number of children",
    example: "no",
    enum: ["no", "yes-1-child", "yes-2-children", "yes-3-plus-children"],
    required: false,
  })
  @Column({ type: "varchar", nullable: true })
  children_count?: string | null;

  // ==================== STEP 10: ABOUT YOU ====================

  @ApiProperty({
    description: "Additional information about the user",
    example: "I'm a quiet professional who enjoys cooking and reading.",
    required: false,
  })
  @Column({ type: "text", nullable: true })
  additional_info?: string | null;


  @Column({ type: "varchar", nullable: true })
  secondary_location?: string | null;

  @Column({ type: "int", nullable: true })
  min_bedrooms?: number | null;

  @Column({ type: "int", nullable: true })
  max_bedrooms?: number | null;

  @Column({ type: "int", nullable: true })
  min_bathrooms?: number | null;

  @Column({ type: "int", nullable: true })
  max_bathrooms?: number | null;

  @Column({ type: "boolean", nullable: true })
  designer_furniture?: boolean | null;

  // ==================== TIMESTAMPS ====================

  @ApiProperty({ description: "Preferences creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Preferences last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // ==================== RELATIONS ====================

  @OneToOne(() => User, (user) => user.preferences, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
