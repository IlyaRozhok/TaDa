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

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.Tenant;

  @IsOptional()
  @IsBoolean()
  is_private_landlord?: boolean;
}
