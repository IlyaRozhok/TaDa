import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

/** Upper bound on one batch — a catalogue page is 12, the largest grid is a shortlist. */
export const MATCH_SCORES_MAX_IDS = 100;

export class GetMatchScoresDto {
  @ApiProperty({
    description: "Property IDs to score against the current user's preferences",
    type: [String],
    maxItems: MATCH_SCORES_MAX_IDS,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MATCH_SCORES_MAX_IDS)
  @IsUUID(undefined, { each: true })
  propertyIds: string[];
}
