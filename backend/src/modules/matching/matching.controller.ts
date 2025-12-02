import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/strategies/jwt.strategy";
import { MatchingService } from "./matching.service";

@ApiTags("Matching")
@Controller("matching")
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * Get matched properties for the current user
   */
  @Get("matches")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get matched properties for current user" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Max results" })
  @ApiQuery({ name: "minScore", required: false, type: Number, description: "Minimum match score (0-100)" })
  @ApiResponse({
    status: 200,
    description: "List of matched properties with scores",
  })
  async getMatches(
    @Request() req: any,
    @Query("limit") limit?: number,
    @Query("minScore") minScore?: number
  ) {
    const userId = req.user.id;
    return this.matchingService.getMatchesForUser(userId, {
      limit: limit ? Number(limit) : 50,
      minScore: minScore ? Number(minScore) : 0,
    });
  }

  /**
   * Get top matches (simplified for property cards)
   */
  @Get("top-matches")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get top matched properties (simplified)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "List of top matched properties",
  })
  async getTopMatches(
    @Request() req: any,
    @Query("limit") limit?: number
  ) {
    const userId = req.user.id;
    return this.matchingService.getTopMatches(userId, limit ? Number(limit) : 20);
  }

  /**
   * Get detailed matches with full category breakdown
   * This is the main endpoint for the matches page
   */
  @Get("detailed-matches")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get detailed matched properties with category breakdown" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "List of matched properties with detailed category scores",
  })
  async getDetailedMatches(
    @Request() req: any,
    @Query("limit") limit?: number
  ) {
    const userId = req.user.id;
    return this.matchingService.getDetailedMatches(userId, limit ? Number(limit) : 20);
  }

  /**
   * Get match details for a specific property
   */
  @Get("property/:propertyId")
  @UseGuards(JwtAuthGuard)
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
   * Get recommendations based on preferences
   * Similar to matches but with additional filtering
   */
  @Get("recommendations")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get property recommendations" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "List of recommended properties",
  })
  async getRecommendations(
    @Request() req: any,
    @Query("limit") limit?: number
  ) {
    const userId = req.user.id;
    // For recommendations, we want higher quality matches
    return this.matchingService.getMatchesForUser(userId, {
      limit: limit ? Number(limit) : 10,
      minScore: 60, // Only show properties with 60%+ match
    });
  }
}

