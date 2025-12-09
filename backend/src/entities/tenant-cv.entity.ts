import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";

export interface RentHistoryEntry {
  property_name: string;
  address?: string;
  city?: string;
  price_per_month?: number;
  bedrooms?: number;
  bathrooms?: number;
  size_sqft?: number;
  property_type?: string;
  furnishing?: string;
  match_score?: number;
  review?: string;
  landlord?: string;
  period_from?: string;
  period_to?: string | null;
  media_url?: string;
}

@Entity("tenant_cvs")
export class TenantCv {
  @ApiProperty({ description: "Unique tenant CV identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "ID of the user who owns this CV" })
  @Column("uuid", { unique: true })
  user_id: string;

  @ApiProperty({
    description: "Shareable public UUID for the CV",
    required: false,
  })
  @Column({ type: "uuid", nullable: true, unique: true })
  share_uuid: string | null;

  @ApiProperty({
    description: "Optional headline text displayed near move status",
    required: false,
  })
  @Column({ nullable: true })
  headline?: string | null;

  @ApiProperty({
    description: "About me text shown on the CV",
    required: false,
  })
  @Column({ type: "text", nullable: true })
  about_me?: string | null;

  @ApiProperty({
    description: "Optional custom hobbies list overriding preferences",
    type: [String],
    required: false,
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  hobbies?: string[];

  @ApiProperty({
    description: "History of previous rentals",
    required: false,
    type: "jsonb",
  })
  @Column({ type: "jsonb", nullable: true, default: [] })
  rent_history?: RentHistoryEntry[];

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

  @ApiProperty({ description: "Creation timestamp" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Last update timestamp" })
  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;
}

