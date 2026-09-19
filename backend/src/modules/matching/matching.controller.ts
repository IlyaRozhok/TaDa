import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { MatchingService } from "./matching.service";
import { GetMatchScoresDto } from "./dto/get-match-scores.dto";
import {
  DEFAULT_MATCHED_PROPERTIES_SORT,
  GetMatchedPropertiesQueryDto,
  MATCHED_PROPERTIES_SORTS,
} from "./dto/get-matched-properties.dto";
import { UserRole } from "@/entities/user.entity";

/** Shared description of the admin-only `asUserId` parameter. */
const AS_USER_ID_QUERY = {
  name: "asUserId",
  required: false,
  type: String,
  description:
    "Admin only — score against this tenant's preferences instead of the caller's (the \"view as tenant\" lens). 403 for any other role; 404 unless the id is an existing tenant. Read-only: no session is created for the tenant.",
} as const;

@ApiTags("Matching")
@Controller("matching")
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * Whose preferences a request is scored against.
   *
   * Without `asUserId` it is the caller, as it always was. With it, the caller
   * must be an admin — checked FIRST, before any lookup, so a tenant probing
   * ids learns nothing about which exist — and the target must be a tenant
   * (`resolveViewAsTarget`). The role comes from `req.user`, which the JWT
   * strategy re-reads from the database on every request, not from the
   * token's claims.
   *
   * Nothing here touches the session: the admin stays signed in as the admin,
   * and only the preference row used for scoring changes.
   */
  private async resolveScoringUser(
    req: { user: { id: string; role: UserRole } },
    asUserId: string | undefined
  ): Promise<{
    userId: string;
    viewingAs: { id: string; full_name: string | null } | null;
  }> {
    if (!asUserId) {
      return { userId: req.user.id, viewingAs: null };
    }

    if (req.user?.role !== UserRole.Admin) {
      throw new ForbiddenException("Only admins can view as another user");
    }

    const target = await this.matchingService.resolveViewAsTarget(asUserId);
    return { userId: target.id, viewingAs: target };
  }

  /**
   * Get match details for a specific property
   */
  @Get("property/:propertyId")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get match details for a specific property" })
  @ApiQuery(AS_USER_ID_QUERY)
  @ApiResponse({
    status: 200,
    description: "Detailed match information for the property",
  })
  async getPropertyMatch(
    @Request() req: any,
    @Param("propertyId", ParseUUIDPipe) propertyId: string,
    @Query("asUserId", new ParseUUIDPipe({ optional: true }))
    asUserId?: string
  ) {
    const { userId } = await this.resolveScoringUser(req, asUserId);
    return this.matchingService.getPropertyMatch(propertyId, userId);
  }

  /**
   * Score a batch of properties in one request.
   * Card grids read their badges from here instead of asking per card.
   */
  @Post("scores")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get match scores for a batch of properties",
  })
  @ApiQuery(AS_USER_ID_QUERY)
  @ApiResponse({
    status: 200,
    description:
      "Map of property id to match score and category breakdown. Empty when the user has no preferences",
  })
  async getMatchScores(
    @Request() req: any,
    @Body() body: GetMatchScoresDto,
    @Query("asUserId", new ParseUUIDPipe({ optional: true }))
    asUserId?: string
  ) {
    const { userId } = await this.resolveScoringUser(req, asUserId);
    return this.matchingService.getMatchScores(body.propertyIds, userId);
  }

  /**
   * The single read path for the results feed: the FULL listed inventory,
   * paginated, searchable and ordered by `sort`. Nothing is hidden for
   * scoring badly — a poor match is ranked honestly at its real percentage
   * and sinks, so `total` is the full listed count under every sort.
   *
   * `prefilters` narrows the candidate set in SQL before the scoring pass
   * (budget, bedrooms, property type — generous ranges, NULLs kept). **OFF by
   * default**: it removed rows from the feed outright, which is what made this
   * route disagree with the public catalogue about how much inventory exists.
   * It survives as an opt-in debug flag — `?prefilters=true` restores the
   * narrowed behaviour of the deleted `/matches` route.
   */
  @Get("matched-properties")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get the full listed inventory with pagination, search and server-side sorting (match score by default)",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: [...MATCHED_PROPERTIES_SORTS],
    description:
      "Ordering of the whole listed inventory. Default `best_match` (scores every candidate, ranks by percentage). The others order in SQL over the same population, with `created_at DESC` as the tie-break and NULL prices/deposits last; the returned page is still scored, so cards keep their match badge",
  })
  @ApiQuery({
    name: "prefilters",
    required: false,
    type: Boolean,
    description:
      "Opt-in debug flag. SQL pre-filtering of properties that fall outside the user's budget, bedroom and property-type preferences before scoring (generous ranges, NULLs kept). Default `false` — the feed ranks the full listed inventory; pass `true` to narrow it. Ignored for a user with no preferences, which is what the filters are derived from",
  })
  @ApiQuery(AS_USER_ID_QUERY)
  @ApiResponse({
    status: 200,
    description:
      "Paginated page of the listed inventory in the requested order. `avgMatchScore` is the mean score over the whole matched set — the population `total` counts, not the returned page — and is `null` when that mean is not knowable (no preferences, nothing matched, or a non-`best_match` sort, which scores only the returned page). With an admin's `asUserId` the envelope also carries `viewingAs: { id, full_name }` for the admin's banner",
  })
  async getMatchedPropertiesWithPagination(
    @Request() req: any,
    @Query() query: GetMatchedPropertiesQueryDto,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("prefilters") prefilters?: string,
    @Query("asUserId", new ParseUUIDPipe({ optional: true }))
    asUserId?: string
  ) {
    const { userId, viewingAs } = await this.resolveScoringUser(req, asUserId);
    // Same caps as every other paginated read (normalizeFindParams,
    // GetMatchScoresDto): this route used to accept ?limit=5000 and hydrate
    // it all — full entities, joins and a presign per photo — per request.
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const result = await this.matchingService.getMatchedPropertiesWithPagination(userId, {
      page: Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1,
      limit:
        Number.isFinite(parsedLimit) && parsedLimit >= 1
          ? Math.min(Math.floor(parsedLimit), 100)
          : 12,
      search,
      // Opt-in, not opt-out: anything other than an explicit `true` ranks the
      // full listed inventory.
      prefilters: prefilters === "true",
      sort: query.sort ?? DEFAULT_MATCHED_PROPERTIES_SORT,
    });

    // Only on the admin view-as path: a tenant's own feed never carries it.
    return viewingAs ? { ...result, viewingAs } : result;
  }
}
