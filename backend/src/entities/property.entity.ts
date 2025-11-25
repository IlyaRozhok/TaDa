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
import { Building } from "./building.entity";

// Enums for property types
export enum PropertyType {
  Flat = "flat",
  Apartment = "apartment",
  House = "house",
  Room = "room",
  Studio = "studio",
  Penthouse = "penthouse",
}

export enum BuildingType {
  ProfessionalManagement = "professional_management",
  BTR = "btr",
  Luxury = "luxury",
  CoLiving = "co_living",
  StudentAccommodation = "student_accommodation",
  RetirementHome = "retirement_home",
}

export enum Furnishing {
  Furnished = "furnished",
  PartFurnished = "part_furnished",
  Unfurnished = "unfurnished",
  DesignerFurniture = "designer_furniture",
}

export enum LetDuration {
  Any = "any",
  LongTerm = "long_term",
  ShortTerm = "short_term",
  Flexible = "flexible",
}

export enum Bills {
  Included = "included",
  Excluded = "excluded",
}

@Entity("properties")
export class Property {
  @ApiProperty({ description: "Unique property identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // REQUIRED FIELDS
  @ApiProperty({ description: "Property title", example: "Modern 2BR Apartment" })
  @Column()
  title: string;

  @ApiProperty({ description: "Property description", example: "Beautiful modern apartment with stunning city views" })
  @Column("text")
  description: string;

  @ApiProperty({ description: "Property address", example: "123 Main St, London" })
  @Column()
  address: string;

  @ApiProperty({ description: "Apartment number", example: "12A" })
  @Column()
  apartment_number: string;

  @ApiProperty({ description: "Building ID" })
  @Column("uuid")
  building_id: string;

  @ApiProperty({ description: "Property types", example: ["apartment", "flat"] })
  @Column("text", { array: true, nullable: true })
  property_types: string[];

  @ApiProperty({ description: "Lifestyle features", example: "gym, pool, parking" })
  @Column("text", { nullable: true })
  lifestyle_features: string;

  @ApiProperty({ description: "Property images URLs", example: "image1.jpg,image2.jpg" })
  @Column("text", { nullable: true })
  images: string;

  @ApiProperty({ description: "Is BTR property", example: true })
  @Column("boolean", { default: false })
  is_btr: boolean;

  @ApiProperty({ description: "Latitude coordinate", example: 51.5074 })
  @Column("decimal", { precision: 10, scale: 7, nullable: true })
  lat: number;

  @ApiProperty({ description: "Longitude coordinate", example: -0.1278 })
  @Column("decimal", { precision: 10, scale: 7, nullable: true })
  lng: number;

  // OPTIONAL FIELDS
  @ApiProperty({
    description: "Property description",
    example: "Beautiful modern apartment with stunning city views",
  })
  @Column("text", { nullable: true })
  descriptions: string;

  @ApiProperty({ description: "Monthly rent price (PCM)", example: 2500 })
  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: "Deposit amount", example: 2500 })
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  deposit: number;

  @ApiProperty({ description: "Available from date", example: "2024-03-01" })
  @Column("date")
  available_from: Date;

  @ApiProperty({
    description: "Bills (energy, Wi-Fi, water, council tax)",
    enum: Bills,
    example: Bills.Included,
  })
  @Column({
    type: "enum",
    enum: Bills,
    default: Bills.Excluded,
    nullable: true,
  })
  bills: Bills;

  @ApiProperty({
    description: "Property type",
    enum: PropertyType,
    example: PropertyType.Apartment,
  })
  @Column({
    type: "enum",
    enum: PropertyType,
    nullable: true,
  })
  property_type: PropertyType;

  @ApiProperty({ description: "Number of bedrooms", example: 2 })
  @Column("int")
  bedrooms: number;

  @ApiProperty({ description: "Number of bathrooms", example: 2 })
  @Column("int")
  bathrooms: number;

  @ApiProperty({
    description: "Building type",
    enum: BuildingType,
    example: BuildingType.BTR,
  })
  @Column({
    type: "enum",
    enum: BuildingType,
    nullable: true,
  })
  building_type: BuildingType;

  @ApiProperty({
    description: "Furnishing type",
    enum: Furnishing,
    example: Furnishing.Furnished,
  })
  @Column({
    type: "enum",
    enum: Furnishing,
  })
  furnishing: Furnishing;

  @ApiProperty({
    description: "Let duration",
    enum: LetDuration,
    example: LetDuration.LongTerm,
  })
  @Column({
    type: "enum",
    enum: LetDuration,
    default: LetDuration.Any,
    nullable: true,
  })
  let_duration: LetDuration;

  @ApiProperty({ description: "Floor number", example: 5 })
  @Column("int", { nullable: true })
  floor: number;

  @ApiProperty({ description: "Has outdoor space", example: true })
  @Column("boolean", { default: false, nullable: true })
  outdoor_space: boolean;

  @ApiProperty({ description: "Has balcony", example: true })
  @Column("boolean", { default: false, nullable: true })
  balcony: boolean;

  @ApiProperty({ description: "Has terrace", example: false })
  @Column("boolean", { default: false, nullable: true })
  terrace: boolean;

  @ApiProperty({ description: "Square meters", example: 65.5 })
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  square_meters: number;

  @ApiProperty({
    description: "Property photos URLs (S3)",
    example: [
      "https://s3.amazonaws.com/bucket/photo1.jpg",
      "https://s3.amazonaws.com/bucket/photo2.jpg",
    ],
    type: [String],
  })
  @Column("text", { array: true, nullable: true, default: [] })
  photos: string[];

  @ApiProperty({
    description: "Property video URL (S3)",
    example: "https://s3.amazonaws.com/bucket/video.mp4",
    nullable: true,
  })
  @Column({ nullable: true })
  video: string;

  @ApiProperty({
    description: "Property documents URL (S3)",
    example: "https://s3.amazonaws.com/bucket/document.pdf",
    nullable: true,
  })
  @Column({ nullable: true })
  documents: string;

  @ApiProperty({ description: "Operator ID (from building)" })
  @Column("uuid", { nullable: true })
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
