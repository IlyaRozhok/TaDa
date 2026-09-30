import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@/entities/user.entity";
import { AdminStatsService } from "./admin-stats.service";
import { AdminStatsResponse } from "./admin-stats.types";
import { AdminStatsQueryDto } from "./dto/admin-stats-query.dto";

/**
 * Aggregate tenant statistics for the admin Tenant Statistics page: who
 * signs up, how far they get, and what they look for. Counts only — no user
 * rows.
 */
@ApiTags("admin-stats")
@Controller("admin/stats")
@Roles(UserRole.Admin)
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiQuery({ name: "from", required: false, description: "Signup date lower bound, YYYY-MM-DD" })
  @ApiQuery({ name: "to", required: false, description: "Signup date upper bound (inclusive), YYYY-MM-DD" })
  @ApiOperation({ summary: "Tenant statistics bundle (admin)" })
  @ApiResponse({ status: 200, description: "Statistics computed" })
  @ApiResponse({ status: 400, description: "Invalid date range" })
  async getStats(@Query() query: AdminStatsQueryDto): Promise<AdminStatsResponse> {
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException("from must not be after to");
    }
    return this.adminStatsService.getStats(query.from, query.to);
  }
}
