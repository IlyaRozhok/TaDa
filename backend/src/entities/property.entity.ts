import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import {
  Building,
  MetroStation,
  CommuteTime,
  LocalEssential,
  Pet,
  BuildingFamilyStatus,
  BuildingOccupation,
  BuildingChildrenCount,
} from "./building.entity";

/**
 * Listing lifecycle. What the market sees is decided here, not by deletion:
 *
 * - `draft`     — being prepared; invisible everywhere public.
 * - `listed`    — live: in the catalogue, in matching, bookable.
 * - `under_offer` — a booking reached the contract stage; hidden from the
 *   catalogue and matching, but the detail page still resolves (shared links
 *   keep working) and other tenants' existing bookings continue.
 * - `let`       — a booking closed as `rented`; not bookable, hidden from
 *   lists, detail page still resolves.
 * - `archived`  — retired by the operator; invisible everywhere public.
 *
 * `rented`/contract-stage transitions in the booking pipeline drive
 * `listed → under_offer → let` automatically; operators/admins can set any
 * value by hand (e.g. re-list after a tenancy ends).
 *
 * NOTE: not exported from the `@/entities` barrel — import from this file
 * (the barrel re-exports classes only, not enums).
 */
export enum PropertyStatus {
  Draft = "draft",
  Listed = "listed",
  UnderOffer = "under_offer",
  Let = "let",
  Archived = "archived",
}

@Entity("properties")
export class Property {
  @ApiProperty({ description: "Unique property identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "Listing lifecycle status",
    enum: PropertyStatus,
    example: PropertyStatus.Listed,
  })
  @Column({
    type: "enum",
    enum: PropertyStatus,
    default: PropertyStatus.Listed,
  })
  status: PropertyStatus;

  // REQUIRED FIELDS
  @ApiProperty({
    description: "Apartment number",
    example: "12A",
    required: false,
  })
  @Column({ nullable: true })
  apartment_number?: string;

  @ApiProperty({ description: "Building ID", required: false })
  @Index("idx_properties_building_id")
  @Column("uuid", { nullable: true })
  // `| null` so an update can actually CLEAR the link: TypeORM's update()
  // silently skips `undefined` values, which is how "convert to private
  // landlord" used to leave the property joined to its old building.
  building_id?: string | null;

  // BASIC FIELDS
  @ApiProperty({
    description: "Property title",
    example: "Modern 2BR Apartment",
  })
  @Column()
  title: string;

  @ApiProperty({
    description: "Property descriptions",
    example: "Beautiful modern apartment",
    required: false,
  })
  @Column("text", { nullable: true })
  descriptions?: string;

  @ApiProperty({
    description: "Property type",
    example: "apartment",
    enum: [
      "apartment",
      "house",
      "studio",
      "penthouse",
      "maisonette",
      "en-suite room",
      "room",
    ],
    required: false,
  })
  @Column({ nullable: true })
  property_type?: string;

  @ApiProperty({
    description: "Furnishing level",
    example: "furnished",
    enum: ["furnished", "unfurnished", "part_furnished"],
    required: false,
  })
  @Column({ nullable: true })
  furnishing?: string;

  @ApiProperty({
    description: "Bills included",
    example: "included",
    enum: ["included", "excluded"],
    required: false,
  })
  @Column({ default: "excluded", nullable: true })
  bills?: string;

  @ApiProperty({
    description: "Available from date",
    example: "2024-01-15",
    required: false,
  })
  @Column({ type: "date", nullable: true })
  available_from?: Date;

  @ApiProperty({
    description: "Building type",
    example: "residential",
    enum: ["btr", "co_living", "professional_management", "private_landlord"],
    required: false,
  })
  @Column({ nullable: true })
  building_type?: string;

  // Inherited fields from building
  @ApiProperty({
    description: "Property address (inherited from building or custom)",
    example: "123 Main St, London",
    required: false,
  })
  @Column({ nullable: true })
  address?: string;

  // GEOCODING — derived from the postcode via postcodes.io on create/update
  // (see GeocodingService). All nullable: a listing without a resolvable
  // postcode still saves; it just cannot be location-matched or mapped.
  @ApiProperty({
    description: "Normalized UK postcode",
    example: "NW1 8XY",
    required: false,
  })
  @Column({ type: "varchar", length: 10, nullable: true })
  postcode?: string | null;

  @ApiProperty({ description: "Latitude (WGS84)", required: false })
  @Column("decimal", { precision: 9, scale: 6, nullable: true })
  latitude?: number | null;

  @ApiProperty({ description: "Longitude (WGS84)", required: false })
  @Column("decimal", { precision: 9, scale: 6, nullable: true })
  longitude?: number | null;

  @ApiProperty({
    description: "London borough (postcodes.io admin_district)",
    example: "Camden",
    required: false,
  })
  @Column({ type: "varchar", nullable: true })
  borough?: string | null;

  // Displaying the EPC band on an advertisement is a legal requirement in
  // England and Wales (and MEES bans letting below E) — nullable only
  // because pre-existing listings have no value yet.
  @ApiProperty({
    description: "EPC band (A-G)",
    example: "C",
    enum: ["A", "B", "C", "D", "E", "F", "G"],
    required: false,
  })
  @Column({ type: "varchar", length: 2, nullable: true })
  epc_rating?: string | null;

  @ApiProperty({
    description:
      "Tenant types for this property (inherited from building or custom)",
    example: ["family", "student"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  tenant_types?: string[];

  @ApiProperty({
    description: "Property amenities (inherited from building or custom)",
    example: ["Parking", "Garden", "Gym"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  amenities?: string[];

  @ApiProperty({
    description: "Apartment-level features (kitchen, bathroom, storage, tech, access)",
    example: ["Dishwasher", "Rainfall shower", "Fibre broadband"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  property_amenities?: string[];

  @ApiProperty({
    description: "Pet policy (inherited from building or custom)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  pet_policy?: boolean;

  @ApiProperty({
    description:
      "Metro stations with travel times (inherited from building or custom)",
    example: [{ label: "Oxford Circus", destination: 5 }],
    type: "json",
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  metro_stations?: MetroStation[];

  @ApiProperty({
    description:
      "Commute times to popular destinations (inherited from building or custom)",
    example: [{ label: "City Centre", destination: 15 }],
    type: "json",
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  commute_times?: CommuteTime[];

  @ApiProperty({
    description:
      "Local essentials with distances (inherited from building or custom)",
    example: [{ label: "Tesco Express", destination: 200 }],
    type: "json",
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  local_essentials?: LocalEssential[];

  @ApiProperty({
    description:
      "Target family statuses for this property (inherited from building or custom)",
    example: ["couple", "couple-with-children"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  family_status?: BuildingFamilyStatus[];

  @ApiProperty({
    description:
      "Target occupations for this property (inherited from building or custom)",
    example: ["student", "young-professional"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  occupation?: BuildingOccupation[];

  @ApiProperty({
    description:
      "Target children statuses for this property (inherited from building or custom)",
    example: ["no", "yes-1-child"],
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  children?: BuildingChildrenCount[];

  @ApiProperty({
    description:
      "Allowed pet types and sizes (inherited from building or custom)",
    example: [{ type: "dog", size: "small" }],
    type: "json",
    required: false,
  })
  @Column({ type: "jsonb", nullable: true })
  pets?: Pet[] | null;

  @ApiProperty({
    description: "Let duration",
    example: "12 months",
    required: false,
  })
  @Column({ nullable: true })
  let_duration?: string;

  @ApiProperty({
    description: "Floor number",
    example: 5,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  floor?: number;

  @ApiProperty({
    description: "Square meters",
    example: 75.5,
    required: false,
  })
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  square_meters?: number;

  @ApiProperty({
    description: "Has balcony",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", default: false })
  balcony?: boolean;

  @ApiProperty({
    description: "Has terrace",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", default: false })
  terrace?: boolean;

  @ApiProperty({
    description: "Monthly rent price (PCM)",
    example: 2500,
    required: false,
  })
  @Index("idx_properties_price")
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  price?: number;

  @ApiProperty({
    description: "Security deposit",
    example: 2500,
    required: false,
  })
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  deposit?: number;

  @ApiProperty({
    description: "Number of bedrooms",
    example: 2,
    required: false,
  })
  @Index("idx_properties_bedrooms")
  @Column("int", { nullable: true })
  bedrooms?: number;

  @ApiProperty({
    description: "Number of bathrooms",
    example: 2,
    required: false,
  })
  @Column("int", { nullable: true })
  bathrooms?: number;

  @ApiProperty({
    description: "Property photos URLs",
    example: ["https://s3.amazonaws.com/bucket/photo1.jpg"],
    type: [String],
    required: false,
  })
  @Column("text", { array: true, nullable: true, default: [] })
  photos: string[];

  @ApiProperty({
    description: "Property video URL",
    example: "https://s3.amazonaws.com/bucket/video.mp4",
    required: false,
  })
  @Column({ nullable: true })
  video?: string;

  @ApiProperty({
    description: "Property documents URL",
    example: "https://s3.amazonaws.com/bucket/document.pdf",
    required: false,
  })
  @Column({ nullable: true })
  documents?: string;

  @ApiProperty({
    description: "Operator ID (from building or direct assignment)",
  })
  @Index("idx_properties_operator_id")
  @Column("uuid")
  operator_id: string;

  @ApiProperty({
    description:
      "Whether the property is featured in the landing pages' listings section. Admin-only flag.",
    example: false,
  })
  @Column({ type: "boolean", default: false })
  is_landing_listing: boolean;

  @ApiProperty({ description: "Property creation date" })
  @Index("idx_properties_created_at")
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Property last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  // Unidirectional: `User` has no `properties` collection, so there is no
  // inverse side to name here.
  // RESTRICT, not CASCADE: deleting an operator account must never take the
  // catalogue and its booking history with it — the same principle as the
  // building FK below. The user-deletion service turns the constraint into
  // an actionable 409 ("reassign or delete their listings first").
  @ManyToOne(() => User, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "operator_id" })
  operator: User;

  // SET NULL, not CASCADE: deleting a building must detach its units, never
  // destroy them — a property carries booking history (including `rented`
  // rows) that a cascade would silently erase. "Convert to private landlord"
  // already clears this link the same way.
  @ManyToOne(() => Building, (building) => building.properties, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "building_id" })
  building: Building;
}
