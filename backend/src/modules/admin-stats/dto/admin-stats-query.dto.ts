import { IsISO8601, IsOptional, Matches } from "class-validator";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Query of `GET /admin/stats`. Both bounds are calendar dates (`YYYY-MM-DD`)
 * matched against `users.created_at`; `to` is inclusive of the whole day.
 * Leaving either out leaves that side of the range open.
 */
export class AdminStatsQueryDto {
  @IsOptional()
  @Matches(DATE_ONLY, { message: "from must be a date in YYYY-MM-DD format" })
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: "to must be a date in YYYY-MM-DD format" })
  @IsISO8601({ strict: true })
  to?: string;
}
