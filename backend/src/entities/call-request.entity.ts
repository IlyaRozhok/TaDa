import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/** Which landing sent the form. Decides the reason vocabulary the client offered. */
export type CallRequestSource = "tenant" | "operator";

/**
 * One "Book a call" submission from a public landing page.
 *
 * Unlike a booking request there is no account behind it: the visitor is
 * anonymous, so every column here is untrusted form input that the DTO has
 * already length-capped and constrained to a closed vocabulary. The row is the
 * durable record — the support email that follows is a notification about it,
 * not the record itself, which is why the handler persists before it emits.
 */
@Entity("call_requests")
export class CallRequest {
  @ApiProperty({ description: "Unique call request identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Stable slug, never the localized label the visitor saw. The landing is
   * translated through Localazy; storing the label would make the same reason
   * a different value per language.
   */
  @ApiProperty({ description: "Reason slug for the call", example: "help_find_home" })
  @Column({ type: "varchar", length: 64 })
  reason: string;

  @ApiProperty({ description: "Full name from the form" })
  @Column({ type: "varchar", length: 200 })
  name: string;

  @ApiProperty({ description: "ISO 3166-1 alpha-2 code of the phone's country", example: "GB" })
  @Column({ type: "varchar", length: 2 })
  phone_country_code: string;

  /** The only contact channel on the form — the visitor is never asked for an email. */
  @ApiProperty({ description: "Phone number as typed, masked by the client" })
  @Column({ type: "varchar", length: 32 })
  phone_number: string;

  @ApiPropertyOptional({
    description: "Preferred time-of-day slugs, or null when the visitor skipped the field",
    example: ["morning", "evening"],
  })
  @Column({ type: "jsonb", nullable: true })
  preferred_times: string[] | null;

  @ApiPropertyOptional({ description: "Free-text notes from the form" })
  @Column({ type: "text", nullable: true })
  notes: string | null;

  @ApiProperty({ description: "Landing that sent the form", example: "tenant" })
  @Index("idx_call_requests_source")
  @Column({ type: "varchar", length: 16 })
  source: CallRequestSource;

  @ApiProperty({ description: "Created at timestamp" })
  @Index("idx_call_requests_created_at")
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Updated at timestamp" })
  @UpdateDateColumn()
  updated_at: Date;
}
