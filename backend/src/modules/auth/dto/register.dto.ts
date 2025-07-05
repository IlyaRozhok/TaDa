import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  IsBoolean,
  IsOptional,
  IsIn,
  IsArray,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "User password",
    example: "password123",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: "Full name of the user", example: "John Doe" })
  @IsString()
  full_name: string;

  @ApiProperty({
    description: "Whether the user is a property operator/landlord",
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_operator?: boolean = false;

  @ApiProperty({
    description: "Age range of the user",
    example: "25-35",
    enum: ["18-25", "26-35", "36-45", "46+"],
    required: false,
  })
  @IsOptional()
  @IsIn(["18-25", "26-35", "36-45", "46+"])
  age_range?: string;

  @ApiProperty({
    description: "User occupation",
    example: "Software Engineer",
    required: false,
  })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({
    description: "Industry the user works in",
    example: "Technology",
    required: false,
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({
    description: "Work style preference",
    example: "Hybrid",
    enum: ["Office", "Remote", "Hybrid", "Freelance"],
    required: false,
  })
  @IsOptional()
  @IsIn(["Office", "Remote", "Hybrid", "Freelance"])
  work_style?: string;

  @ApiProperty({
    description: "Lifestyle preferences",
    example: ["Active", "Social"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lifestyle?: string[];

  @ApiProperty({
    description: "Pet preference",
    example: "Cat",
    enum: ["None", "Cat", "Dog", "Other"],
    required: false,
  })
  @IsOptional()
  @IsIn(["None", "Cat", "Dog", "Other"])
  pets?: string;

  @ApiProperty({
    description: "Whether the user is a smoker",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  smoker?: boolean;
}
