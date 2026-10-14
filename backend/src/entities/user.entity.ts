import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Preferences } from "./preferences.entity";
import { TenantProfile } from "./tenant-profile.entity";
import { OperatorProfile } from "./operator-profile.entity";
import { Shortlist } from "./shortlist.entity";
import { Building } from "./building.entity";
import { TenantCv } from "./tenant-cv.entity";

export enum UserRole {
  Admin = "admin",
  Operator = "operator",
  Tenant = "tenant",
}

export enum UserStatus {
  Active = "active",
  Inactive = "inactive",
  Suspended = "suspended",
}

@Entity("users")
// One verified number, one account (migration 1788700000000).
@Index("uq_users_verified_phone", ["phone"], {
  unique: true,
  where: `"phone_verified_at" IS NOT NULL`,
})
export class User {
  @ApiProperty({ description: "Unique user identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  password: string;

  @Column({ select: false, nullable: true, type: "varchar" })
  refresh_token_hash: string | null;

  @ApiProperty({
    description: "Primary user role",
    example: "tenant",
    enum: UserRole,
  })
  @Column({
    type: "enum",
    enum: UserRole,
    nullable: true,
  })
  role: UserRole;

  @ApiProperty({
    description: "User account status",
    example: "active",
    enum: UserStatus,
  })
  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.Active,
  })
  status: UserStatus;

  @ApiProperty({
    description: "Authentication provider",
    example: "local",
    enum: ["local", "google"],
  })
  @Column({ default: "local" })
  provider: string;

  @ApiProperty({
    description: "Google ID for OAuth users",
    example: "123456789012345678901",
  })
  // The hottest auth-path lookup: every Google sign-in resolves the account
  // by this column. The index existed once and was dropped by the
  // auto-generated 1764203300507 migration; without it each login is a
  // sequential scan over `users`.
  @Index("idx_users_google_id")
  @Column({ nullable: true })
  google_id: string;

  @ApiProperty({
    description: "User avatar URL",
    example: "https://example.com/avatar.jpg",
  })
  @Column({ nullable: true })
  avatar_url: string;

  @ApiProperty({
    description: "Whether email is verified",
    example: true,
  })
  @Column({ default: false })
  email_verified: boolean;

  @ApiProperty({ description: "User creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "User last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({ description: "User full name", example: "John Doe" })
  @Column({ nullable: true })
  full_name: string;

  @ApiProperty({ description: "First name", example: "John" })
  @Column({ nullable: true })
  first_name: string;

  @ApiProperty({ description: "Last name", example: "Doe" })
  @Column({ nullable: true })
  last_name: string;

  @ApiProperty({
    description: "Current address",
    example: "123 Main St, London",
  })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({ description: "Mobile number, E.164", example: "+447123456789", nullable: true })
  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  /** ISO 3166-1 alpha-2 country of `phone`, derived from it on every save. */
  @ApiProperty({ description: "Country of the phone number (ISO 3166-1 alpha-2)", example: "GB", nullable: true })
  @Column({ type: "varchar", length: 2, nullable: true })
  phone_country: string | null;

  /**
   * Set by the planned phone backfill for a stored number it could not
   * normalise (truncated, landline, junk), so the user can be asked to
   * re-enter it. Not read by any UI yet.
   */
  @Column({ type: "boolean", default: false })
  phone_needs_update: boolean;

  /**
   * When `phone` was confirmed by SMS code. Null until then — every account
   * that predates verification starts null — and reset whenever the number
   * changes. A verified number belongs to one account only (partial unique
   * index `uq_users_verified_phone`).
   */
  @ApiProperty({ description: "When the phone was verified by SMS", nullable: true })
  @Column({ type: "timestamptz", nullable: true })
  phone_verified_at: Date | null;

  @ApiProperty({ description: "Date of birth", example: "1990-01-15" })
  @Column({ type: "date", nullable: true })
  date_of_birth: Date;

  @ApiProperty({ description: "Nationality", example: "British" })
  @Column({ nullable: true })
  nationality: string;

  // Relations
  @OneToOne(() => Preferences, (preferences) => preferences.user, {
    cascade: true,
  })
  preferences: Preferences;

  @OneToOne(() => TenantProfile, (tenantProfile) => tenantProfile.user, {
    cascade: true,
  })
  tenantProfile: TenantProfile;

  @OneToOne(() => TenantCv, (tenantCv) => tenantCv.user, {
    cascade: true,
  })
  tenantCv: TenantCv;

  @OneToOne(() => OperatorProfile, (operatorProfile) => operatorProfile.user, {
    cascade: true,
  })
  operatorProfile: OperatorProfile;

  @OneToMany(() => Shortlist, (shortlist) => shortlist.user)
  shortlists: Shortlist[];

  @OneToMany(() => Building, (building) => building.operator)
  buildings: Building[];

  // Computed property for backward compatibility
  get roles(): string[] {
    return [this.role];
  }

  // Computed property kept for backward compatibility; full_name is canonical
  // on the users table now.
  get computed_full_name(): string | null {
    return this.full_name || null;
  }
}
