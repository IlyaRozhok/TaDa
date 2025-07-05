import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Preferences } from "./preferences.entity";

@Entity("users")
export class User {
  @ApiProperty({ description: "Unique user identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @Column({ unique: true })
  @Index()
  email: string;

  @Exclude()
  @Column({ select: false })
  password: string;

  @ApiProperty({ description: "Full name of the user", example: "John Doe" })
  @Column()
  full_name: string;

  @ApiProperty({
    description: "Age range of the user",
    example: "25-34",
    enum: ["under-25", "25-34", "35-44", "45-54", "55+"],
  })
  @Column({ nullable: true })
  age_range: string;

  @ApiProperty({ description: "User phone number", example: "+44 7700 900123" })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ description: "User date of birth", example: "1990-01-15" })
  @Column({ type: "date", nullable: true })
  date_of_birth: Date;

  @ApiProperty({ description: "User nationality", example: "British" })
  @Column({ nullable: true })
  nationality: string;

  @ApiProperty({ description: "User occupation", example: "Software Engineer" })
  @Column({ nullable: true })
  occupation: string;

  @ApiProperty({
    description: "Industry the user works in",
    example: "Technology",
  })
  @Column({ nullable: true })
  industry: string;

  @ApiProperty({
    description: "Work style preference",
    example: "Hybrid",
    enum: ["Office", "Remote", "Hybrid", "Freelance"],
  })
  @Column({ nullable: true })
  work_style: string;

  @ApiProperty({
    description: "Lifestyle preferences as array of strings",
    example: ["Active", "Social", "Quiet"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  lifestyle: string[];

  @ApiProperty({
    description: "Pet ownership information",
    example: "Cat",
    enum: ["None", "Cat", "Dog", "Other"],
  })
  @Column({ nullable: true })
  pets: string;

  @ApiProperty({ description: "Whether the user smokes", example: false })
  @Column({ default: false })
  smoker: boolean;

  @ApiProperty({
    description: "User's hobbies and lifestyle preferences",
    example: ["gym", "cooking", "socialising"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  hobbies: string[];

  @ApiProperty({
    description: "Ideal living environment preference",
    example: "social",
    enum: [
      "social",
      "quiet",
      "family-friendly",
      "pet-friendly",
      "trendy",
      "green",
    ],
  })
  @Column({ nullable: true })
  ideal_living_environment: string;

  @ApiProperty({
    description: "Additional information for landlords",
    example: "I'm a quiet professional who loves cooking",
  })
  @Column({ type: "text", nullable: true })
  additional_info: string;

  @ApiProperty({
    description: "Whether the user is a property operator/landlord",
    example: false,
  })
  @Column({ default: false })
  is_operator: boolean;

  @ApiProperty({ description: "User creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "User last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => Preferences, (preferences) => preferences.user, {
    cascade: true,
  })
  @JoinColumn()
  preferences: Preferences;
}
