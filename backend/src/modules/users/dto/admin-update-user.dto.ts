import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { IsOptionalPhone } from "@/common/decorators/phone.decorators";
import { UserRole, UserStatus } from "@/entities/user.entity";

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsEnum(UserRole)
  role?: UserRole;

  /** International format, stored as E.164; "" clears it. */
  @IsOptionalPhone()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  is_private_landlord?: boolean;
}
