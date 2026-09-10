import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/** Which landing sent the form. Both offer the same reason list. */
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
  @ApiProperty({ description: "Reason slug for the call", example: "looking_for_home" })
  @Column({ type: "varchar", length: 64 })
  reason: string;

  @ApiProperty({ description: "Full name from the form" })
  @Column({ type: "varchar", length: 200 })
  name: string;

  /**
   * How the visitor asked to be reached, and therefore which of the two
   * contact columns below is populated: `email` fills `email` and leaves the
   * phone pair null, `voice_call`/`video_call` do the reverse. Exactly one
   * side is ever set — the DTO enforces that before the row is built.
   */
  @ApiProperty({ description: "Preferred contact method slug", example: "voice_call" })
  @Column({ type: "varchar", length: 16 })
  contact_method: string;

  @ApiPropertyOptional({
    description: "ISO 3166-1 alpha-2 code of the phone's country, or null when the method is email",
    example: "GB",
  })
  @Column({ type: "varchar", length: 2, nullable: true })
  phone_country_code: string | null;

  @ApiPropertyOptional({
    description: "Phone number as typed, masked by the client, or null when the method is email",
  })
  @Column({ type: "varchar", length: 32, nullable: true })
  phone_number: string | null;

  /**
   * The visitor's own address, and only for the `email` method. Never a
   * notification recipient — the support inbox is resolved from config.
   */
  @ApiPropertyOptional({
    description: "Email address, or null unless the method is email",
    example: "jane@example.com",
  })
  @Column({ type: "varchar", length: 254, nullable: true })
  email: string | null;

  @ApiPropertyOptional({
    description:
      "Preferred time as the visitor typed it, or null when they skipped the field",
    example: "Weekday evenings after 6pm",
  })
  @Column({ type: "varchar", length: 120, nullable: true })
  preferred_time: string | null;

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
