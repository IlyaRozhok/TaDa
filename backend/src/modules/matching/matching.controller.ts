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
    @Param("propertyId") propertyId: string
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
   * `prefilters` is the opt-in successor of the deleted `/matches` route. That
   * route narrowed the candidate set in SQL before scoring, which is why the
   * same property could be visible here and hidden there. Off by default, so
   * the default answer is the full inventory ranked — the behaviour this route
   * has always had.
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
      "Pass `true` to drop properties that fall outside the user's budget, bedroom and property-type preferences before scoring. Default `false` — the whole inventory is ranked. Ignored for a user with no preferences, which is what the filters are derived from",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of matched properties sorted by match score",
  })
  async getMatchedPropertiesWithPagination(
    @Request() req: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("prefilters") prefilters?: string
  ) {
    const userId = req.user.id;
    return this.matchingService.getMatchedPropertiesWithPagination(userId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
      search,
      prefilters: prefilters === "true",
    });
  }
}
