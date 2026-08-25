import {
  Body,
  Controller,
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

@ApiTags("Matching")
@Controller("matching")
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * Get match details for a specific property
   */
  @Get("property/:propertyId")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get match details for a specific property" })
  @ApiResponse({
    status: 200,
    description: "Detailed match information for the property",
  })
  async getPropertyMatch(
    @Request() req: any,
    @Param("propertyId", ParseUUIDPipe) propertyId: string
  ) {
    const userId = req.user.id;
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
  @ApiResponse({
    status: 200,
    description:
      "Map of property id to match score and category breakdown. Empty when the user has no preferences",
  })
  async getMatchScores(@Request() req: any, @Body() body: GetMatchScoresDto) {
    const userId = req.user.id;
    return this.matchingService.getMatchScores(body.propertyIds, userId);
  }

  /**
   * The single read path for matched properties: the whole inventory ranked by
   * match score, paginated and searchable.
   *
   * `prefilters` narrows the candidate set in SQL before the scoring pass
   * (budget, bedrooms, property type — generous ranges, NULLs kept). ON by
   * default since the 2026-08-21 hardening batch: it only drops rows that
   * could never rank, and it is half of what keeps this route from scoring
   * the whole table per request (the other half is the ranking cache).
   * `?prefilters=false` restores the old rank-everything behaviour.
   */
  @Get("matched-properties")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get matched properties with pagination and search (sorted by match score)",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({
    name: "prefilters",
    required: false,
    type: Boolean,
    description:
      "SQL pre-filtering of properties that fall outside the user's budget, bedroom and property-type preferences before scoring (generous ranges, NULLs kept). Default `true`; pass `false` to rank the whole inventory. Ignored for a user with no preferences, which is what the filters are derived from",
  })
  @ApiResponse({
    status: 200,
    description:
      "Paginated list of matched properties sorted by match score. `avgMatchScore` is the mean score over the whole matched set — the population `total` counts, not the returned page — and is `null` when nothing was scored (no preferences, or no property matched)",
  })
  async getMatchedPropertiesWithPagination(
    @Request() req: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("prefilters") prefilters?: string
  ) {
    const userId = req.user.id;
    // Same caps as every other paginated read (normalizeFindParams,
    // GetMatchScoresDto): this route used to accept ?limit=5000 and hydrate
    // it all — full entities, joins and a presign per photo — per request.
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    return this.matchingService.getMatchedPropertiesWithPagination(userId, {
      page: Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1,
      limit:
        Number.isFinite(parsedLimit) && parsedLimit >= 1
          ? Math.min(Math.floor(parsedLimit), 100)
          : 12,
      search,
      prefilters: prefilters !== "false",
    });
  }
}
