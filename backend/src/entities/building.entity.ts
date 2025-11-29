import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { Property } from "./property.entity";

// Type definitions for structured data
export type UnitType =
  | "studio"
  | "1-bed"
  | "2-bed"
  | "3-bed"
  | "Duplex"
  | "penthouse";

export type TenantType =
  | "corporateLets"
  | "sharers"
  | "student"
  | "family"
  | "elder";

export type PetSize = "small" | "medium" | "large";

export type PetType = "dog" | "cat" | "other";

export interface MetroStation {
  label: string;
  destination: number; // time in minutes
}

export interface CommuteTime {
  label: string;
  destination: number; // time in minutes
}

export interface LocalEssential {
  label: string;
  destination: number; // distance in meters
}

export interface ConciergeHours {
  from: number; // hour 0-23
  to: number; // hour 0-23
}

export interface Pet {
  type: PetType;
  customType?: string; // for "other" type - custom pet name
  size?: PetSize; // optional for all types, but recommended for dog and cat
}

@Entity("buildings")
export class Building {
  @ApiProperty({ description: "Unique building identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "Name of the building",
    example: "Sunset Gardens",
  })
  @Column()
  name: string;

  @ApiProperty({
    description: "Address of the building",
    example: "123 Sunset Boulevard, London, SW1A 1AA",
    required: false,
  })
  @Column({ nullable: true })
  address: string | null;

  @ApiProperty({
    description: "Total number of units in the building",
    example: 150,
    required: false,
  })
  @Column({ type: "int", nullable: true })
  number_of_units: number | null;

  @ApiProperty({
    description: "Types of units in the building",
    example: ["2-bed", "3-bed"],
    type: [String],
    enum: ["studio", "1-bed", "2-bed", "3-bed", "Duplex", "penthouse"],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  type_of_unit: UnitType[];

  @ApiProperty({
    description: "Logo URL (stored in S3)",
    example: "https://s3.amazonaws.com/bucket/logo.jpg",
    required: false,
  })
  @Column({ nullable: true })
  logo: string;

  @ApiProperty({
    description: "Video URL (stored in S3)",
    example: "https://s3.amazonaws.com/bucket/video.mp4",
    required: false,
  })
  @Column({ nullable: true })
  video: string;

  @ApiProperty({
    description: "Array of photo URLs (stored in S3)",
    example: [
      "https://s3.amazonaws.com/bucket/photo1.jpg",
      "https://s3.amazonaws.com/bucket/photo2.jpg",
      "https://s3.amazonaws.com/bucket/photo3.jpg",
    ],
    type: [String],
    required: false,
  })
  @Column("simple-array", { nullable: true, default: "" })
  photos: string[];

  @ApiProperty({
    description: "Document URL (PDF, stored in S3)",
    example: "https://s3.amazonaws.com/bucket/document.pdf",
    required: false,
  })
  @Column({ nullable: true })
  documents: string | null;

  @ApiProperty({
    description: "Metro stations with travel times",
    example: [
      { label: "Oxford Circus", destination: 5 },
      { label: "Piccadilly Circus", destination: 10 },
    ],
    type: "json",
  })
  @Column({ type: "jsonb" })
  metro_stations: MetroStation[];

  @ApiProperty({
    description: "Commute times to popular destinations",
    example: [
      { label: "City Centre", destination: 15 },
      { label: "Canary Wharf", destination: 25 },
    ],
    type: "json",
  })
  @Column({ type: "jsonb" })
  commute_times: CommuteTime[];

  @ApiProperty({
    description: "Local essentials with distances",
    example: [
      { label: "Tesco Express", destination: 200 },
      { label: "Gym", destination: 150 },
    ],
    type: "json",
  })
  @Column({ type: "jsonb" })
  local_essentials: LocalEssential[];

  @ApiProperty({
    description: "Building amenities",
    example: ["Co-working", "Parking", "Garden"],
    type: [String],
  })
  @Column({ type: "jsonb", default: "[]" })
  amenities: string[];

  @ApiProperty({
    description: "Whether building has concierge service",
    example: true,
  })
  @Column({ type: "boolean" })
  is_concierge: boolean;

  @ApiProperty({
    description: "Concierge operating hours (if available)",
    example: { from: 8, to: 22 },
    required: false,
    type: "json",
  })
  @Column({ type: "jsonb", nullable: true })
  concierge_hours: ConciergeHours | null;

  @ApiProperty({
    description: "Pet policy - are pets allowed",
    example: false,
    default: false,
  })
  @Column({ type: "boolean", default: false })
  pet_policy: boolean;

  @ApiProperty({
    description: "Allowed pet types and sizes",
    example: [
      { type: "dog", size: "small" },
      { type: "cat", size: "medium" },
    ],
    required: false,
    type: "json",
  })
  @Column({ type: "jsonb", nullable: true })
  pets: Pet[] | null;

  @ApiProperty({
    description: "Whether building has smoking area",
    example: false,
    default: false,
  })
  @Column({ type: "boolean", default: false })
  smoking_area: boolean;

  @ApiProperty({
    description: "Types of tenants the building is designed for",
    example: ["family", "student"],
    type: [String],
    enum: ["corporateLets", "sharers", "student", "family", "elder"],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: ["family"] })
  tenant_type: TenantType[];

  @ApiProperty({ description: "Building creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Building last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.buildings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "operator_id" })
  operator: User;

  @Column({ type: "uuid", nullable: true })
  operator_id: string | null;

  @OneToMany(() => Property, (property) => property.building)
  properties: Property[];
}
