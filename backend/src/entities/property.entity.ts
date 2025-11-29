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

  @ApiProperty({ description: "Building ID" })
  @Column("uuid")
  building_id: string;

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
