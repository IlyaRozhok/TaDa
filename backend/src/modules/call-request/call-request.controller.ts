import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { Public } from "@/common/decorators/public.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { CallRequest, CallRequestSource } from "@/entities/call-request.entity";
import { UserRole } from "@/entities/user.entity";
import { CallRequestService } from "./call-request.service";
import { CreateCallRequestDto } from "./dto/create-call-request.dto";
import { CALL_REQUEST_SOURCES } from "./call-request.vocabulary";

/**
 * The "Book a call" form on the two public landings, plus the admin listing of
 * what it produced. It replaces the demo-request endpoint, which only ever
 * emailed: submissions are now a durable row first and a support email second.
 */
@ApiTags("call-requests")
@Controller("call-requests")
export class CallRequestController {
  constructor(private readonly callRequestService: CallRequestService) {}

  @Post()
  @Public()
  @HttpCode(202)
  // Email-producing and unauthenticated — throttled like the auth endpoints.
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Submit a call request from a public landing form" })
  @ApiResponse({ status: 202, description: "Request stored and accepted for delivery" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  async requestCall(@Body() dto: CreateCallRequestDto): Promise<{ success: true }> {
    await this.callRequestService.create(dto);

    // 202: stored, and accepted for delivery. Whether SES ultimately sends the
    // notification is the outbox's and retry worker's business, not this
    // request's.
    return { success: true };
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiQuery({ name: "source", required: false, enum: CALL_REQUEST_SOURCES })
  @ApiOperation({ summary: "List call requests (admin)" })
  @ApiResponse({ status: 200, description: "Call requests retrieved" })
  async findAll(
    @Query("source") source?: CallRequestSource,
  ): Promise<CallRequest[]> {
    return this.callRequestService.findAll(source);
  }
}
