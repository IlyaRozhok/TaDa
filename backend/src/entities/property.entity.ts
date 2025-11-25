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
  @ApiProperty({ description: "Apartment number", example: "12A" })
  @Column()
  apartment_number: string;

  @ApiProperty({ description: "Building ID" })
  @Column("uuid")
  building_id: string;

  // BASIC FIELDS
  @ApiProperty({ description: "Property title", example: "Modern 2BR Apartment" })
  @Column()
  title: string;

  @ApiProperty({ description: "Property description", example: "Beautiful modern apartment", required: false })
  @Column("text", { nullable: true })
  description?: string;

  @ApiProperty({ description: "Monthly rent price (PCM)", example: 2500, required: false })
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  price?: number;

  @ApiProperty({ description: "Number of bedrooms", example: 2, required: false })
  @Column("int", { nullable: true })
  bedrooms?: number;

  @ApiProperty({ description: "Number of bathrooms", example: 2, required: false })
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
