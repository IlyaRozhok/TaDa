import { ApiProperty } from "@nestjs/swagger";
import { IsDateString } from "class-validator";

export class ProposeViewingDto {
  @ApiProperty({
    description: "Proposed viewing slot (ISO 8601, must be in the future)",
    example: "2026-09-05T14:30:00.000Z",
  })
  @IsDateString()
  proposed_viewing_at: string;
}
