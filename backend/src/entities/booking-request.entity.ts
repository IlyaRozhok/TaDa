import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Property } from "./property.entity";
import { User } from "./user.entity";

export enum BookingRequestStatus {
  New = "new",
  Contacting = "contacting",
  KycReferencing = "kyc_referencing",
  ApprovedViewing = "approved_viewing",
  Viewing = "viewing",
  Contract = "contract",
  Deposit = "deposit",
  FullPayment = "full_payment",
  MoveIn = "move_in",
  Rented = "rented",
  CancelBooking = "cancel_booking",
}

/**
 * Booking stages from `contract` onward: money or signatures are in play, so
 * the market treats the property as taken (`under_offer`). Shared between the
 * booking pipeline (which drives the property lifecycle on transitions) and
 * user deletion (which must revert the lifecycle when these rows cascade
 * away with a deleted tenant).
 */
export const BOOKING_UNDER_OFFER_STAGES: BookingRequestStatus[] = [
  BookingRequestStatus.Contract,
  BookingRequestStatus.Deposit,
  BookingRequestStatus.FullPayment,
  BookingRequestStatus.MoveIn,
];

@Entity("booking_requests")
@Unique(["tenant_id", "property_id"])
export class BookingRequest {
  @ApiProperty({ description: "Unique booking request identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "Requested property ID" })
  @Index("idx_booking_requests_property_id")
  @Column("uuid")
  property_id: string;

  @ApiProperty({ description: "Tenant user ID" })
  @Column("uuid")
  tenant_id: string;

  @ApiProperty({ description: "Preferred move-in date from the form", required: false })
  @Column({ type: "date", nullable: true })
  date_from: Date | null;

  @ApiProperty({ description: "Preferred move-out date from the form", required: false })
  @Column({ type: "date", nullable: true })
  date_to: Date | null;

  // VIEWING — a viewing is an appointment, not just a pipeline status.
  @ApiProperty({
    description: "Viewing slot proposed by the operator/admin",
    required: false,
  })
  @Column({ type: "timestamp", nullable: true })
  proposed_viewing_at: Date | null;

  @ApiProperty({
    description: "When the tenant confirmed the proposed viewing slot",
    required: false,
  })
  @Column({ type: "timestamp", nullable: true })
  viewing_confirmed_at: Date | null;

  @ApiProperty({ description: "Contact email from the booking form", required: false })
  @Column({ type: "varchar", nullable: true })
  email: string | null;

  @ApiProperty({ description: "Contact phone from the booking form", required: false })
  @Column({ type: "varchar", nullable: true })
  phone_number: string | null;

  @ApiProperty({ description: "Description from the booking form", required: false })
  @Column({ type: "text", nullable: true })
  description: string | null;

  @ApiProperty({
    description: "Current booking status",
    enum: BookingRequestStatus,
    default: BookingRequestStatus.New,
  })
  @Column({
    type: "enum",
    enum: BookingRequestStatus,
    default: BookingRequestStatus.New,
  })
  status: BookingRequestStatus;

  @ApiProperty({ description: "Created at timestamp" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Updated at timestamp" })
  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Property, { onDelete: "CASCADE" })
  @JoinColumn({ name: "property_id" })
  property: Property;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: User;
}
