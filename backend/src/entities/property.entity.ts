import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import {
  Building,
  MetroStation,
  CommuteTime,
  LocalEssential,
  ConciergeHours,
  Pet,
} from "./building.entity";

@Entity("properties")
export class Property {
  @ApiProperty({ description: "Unique property identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // REQUIRED FIELDS
  @ApiProperty({
    description: "Apartment number",
    example: "12A",
    required: false,
  })
  @Column({ nullable: true })
  apartment_number?: string;

  @ApiProperty({ description: "Building ID", required: false })
  @Column("uuid", { nullable: true })
  building_id?: string;

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
    enum: ["apartment", "house", "studio", "penthouse", "duplex"],
    required: false,
  })
  @Column({ nullable: true })
  property_type?: string;

  @ApiProperty({
    description: "Furnishing level",
    example: "furnished",
    enum: ["furnished", "unfurnished", "partially_furnished"],
    required: false,
  })
  @Column({ nullable: true })
  furnishing?: string;

  @ApiProperty({
    description: "Bills included",
    example: "included",
    enum: ["included", "excluded", "some_included"],
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
    enum: ["residential", "commercial", "mixed"],
    required: false,
  })
  @Column({ nullable: true })
  building_type?: string;

  @ApiProperty({
    description: "Whether the property is luxury",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", default: false })
  luxury?: boolean;

  // Inherited fields from building
  @ApiProperty({
    description: "Property address (inherited from building or custom)",
    example: "123 Main St, London",
    required: false,
  })
  @Column({ nullable: true })
  address?: string;

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
    description:
      "Whether property has concierge (inherited from building or custom)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  is_concierge?: boolean;

  @ApiProperty({
    description: "Pet policy (inherited from building or custom)",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  pet_policy?: boolean;

  @ApiProperty({
    description:
      "Smoking area availability (inherited from building or custom)",
    example: false,
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  smoking_area?: boolean;

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
      "Concierge operating hours (inherited from building or custom)",
    example: { from: 8, to: 22 },
    type: "json",
    required: false,
  })
  @Column({ type: "jsonb", nullable: true })
  concierge_hours?: ConciergeHours | null;

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
    description: "Has outdoor space",
    example: true,
    required: false,
  })
  @Column({ type: "boolean", default: false })
  outdoor_space?: boolean;

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
  @Column("uuid")
  operator_id: string;

  @ApiProperty({ description: "Property creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Property last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "operator_id" })
  operator: User;

  @ManyToOne(() => Building, (building) => building.properties, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "building_id" })
  building: Building;
}
