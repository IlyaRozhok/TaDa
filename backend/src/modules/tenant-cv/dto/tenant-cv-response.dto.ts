import { ApiProperty } from "@nestjs/swagger";
import { Preferences } from "../../../entities/preferences.entity";
import { RentHistoryEntry } from "../../../entities/tenant-cv.entity";

class TenantCvProfileDto {
  @ApiProperty()
  full_name: string | null;

  @ApiProperty({ required: false })
  avatar_url?: string | null;

  @ApiProperty({ required: false })
  email?: string | null;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({
    required: false,
    description: "Age in years if date_of_birth is available",
  })
  age_years?: number | null;

  @ApiProperty({ required: false })
  nationality?: string | null;

  @ApiProperty({ required: false })
  occupation?: string | null;

  @ApiProperty({ required: false })
  address?: string | null;
}

class TenantCvMetaDto {
  @ApiProperty({ required: false })
  headline?: string | null;

  @ApiProperty({ required: false })
  kyc_status?: string | null;

  @ApiProperty({ required: false })
  referencing_status?: string | null;

  @ApiProperty({ required: false })
  move_in_date?: string | null;

  @ApiProperty({ required: false })
  move_out_date?: string | null;

  @ApiProperty({ required: false })
  created_at?: string | null;

  @ApiProperty({ required: false })
  smoker?: string | null;

  @ApiProperty({ required: false })
  pets?: string | null;

  @ApiProperty({ required: false })
  tenant_type_labels?: string[];
}

export class TenantCvResponseDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty({ required: false })
  share_uuid?: string | null;

  @ApiProperty({ type: TenantCvProfileDto })
  profile: TenantCvProfileDto;

  @ApiProperty({ type: TenantCvMetaDto })
  meta: TenantCvMetaDto;

  @ApiProperty({ description: "Preferences snapshot", required: false })
  preferences?: Preferences | null;

  @ApiProperty({ required: false })
  amenities?: string[];

  @ApiProperty({ required: false })
  about?: string | null;

  @ApiProperty({ required: false })
  hobbies?: string[];

  @ApiProperty({ type: [Object], description: "Rent history entries" })
  rent_history?: RentHistoryEntry[];
}
