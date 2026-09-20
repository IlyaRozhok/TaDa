import { IsIn, IsNumberString, IsOptional, IsString, IsUUID } from "class-validator";

/**
 * Query of the admin properties list, `GET /properties`.
 *
 * Every field arrives as a string on the wire; `normalizeAdminFindParams`
 * (property.mapper) turns them into the typed filter the service builds its
 * query from — the same split the public list already uses with
 * `FindPropertiesDto` / `normalizeFindParams`.
 *
 * Bed and bath counts come in two flavours because the UI offers closed
 * buckets (Studio / 1 / 2 / 3) and one open-ended bucket (4+): `bedrooms`
 * matches exactly, `bedrooms_min` matches from that count upwards. Sending
 * both narrows to their intersection.
 */
export class FindAdminPropertiesDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  /** Matched case-insensitively against the title and the description. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  building_id?: string;

  @IsOptional()
  @IsUUID()
  operator_id?: string;

  /** "true" narrows to the flagged landing listings, "false" to the rest. */
  @IsOptional()
  @IsIn(["true", "false"])
  is_landing_listing?: string;

  /**
   * Free-form on purpose: the column is a plain varchar and the values in the
   * database predate the admin form's option list, so an `@IsIn` here would
   * reject filters for types that really are stored.
   */
  @IsOptional()
  @IsString()
  property_type?: string;

  @IsOptional()
  @IsNumberString()
  bedrooms?: string;

  @IsOptional()
  @IsNumberString()
  bedrooms_min?: string;

  @IsOptional()
  @IsNumberString()
  bathrooms?: string;

  @IsOptional()
  @IsNumberString()
  bathrooms_min?: string;
}
