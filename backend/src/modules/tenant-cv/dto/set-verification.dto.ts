import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";
import { VERIFICATION_STATUS_VALUES } from "@/common/constants/vocabulary";

/**
 * Admin-only: the verification badges shown on a tenant CV. These used to be
 * free-text fields on the tenant-editable DTO — a tenant could certify
 * themselves as "passed". Now an admin sets them after actually verifying
 * something (during the concierge phase by hand; later by a referencing
 * provider integration).
 */
export class SetVerificationDto {
  @ApiPropertyOptional({
    description: "KYC (identity) verification state",
    enum: VERIFICATION_STATUS_VALUES,
    example: "passed",
  })
  @IsOptional()
  @IsIn(VERIFICATION_STATUS_VALUES)
  kyc_status?: string;

  @ApiPropertyOptional({
    description: "Referencing verification state",
    enum: VERIFICATION_STATUS_VALUES,
    example: "in_progress",
  })
  @IsOptional()
  @IsIn(VERIFICATION_STATUS_VALUES)
  referencing_status?: string;
}
