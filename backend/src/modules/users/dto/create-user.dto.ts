import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { UserRole } from "../../../entities/user.entity";

export class CreateUserDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsEmail()
  email: string;

  // Optional: auth is Google-only, so an admin-created account is reached by
  // its owner's first Google sign-in (linked by verified email), not by a
  // password. Kept accepted for forward compatibility; nothing reads it today.
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.Tenant;

  @IsOptional()
  @IsBoolean()
  is_private_landlord?: boolean;
}
