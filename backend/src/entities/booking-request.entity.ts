import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
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

@Entity("booking_requests")
@Unique(["property_id", "tenant_id"])
export class BookingRequest {
  @ApiProperty({ description: "Unique booking request identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "Requested property ID" })
  @Column("uuid")
  property_id: string;

  @ApiProperty({ description: "Tenant user ID" })
  @Column("uuid")
  tenant_id: string;

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
