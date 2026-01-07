import { IsNumberString, IsOptional, IsString, IsUUID } from "class-validator";

export class FindPropertiesDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  building_id?: string;
}
