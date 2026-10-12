import { Body, Controller, Get, HttpCode, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { User } from "@/entities/user.entity";
import { SendPhoneCodeDto, VerifyPhoneCodeDto } from "./dto/phone-code.dto";
import { PhoneVerificationService } from "./phone-verification.service";

/**
 * SMS verification of the signed-in user's own phone. Errors come back as
 * `{ statusCode, code, message }` with an English `message` the screen
 * shows as-is (see phone-verification.errors.ts).
 */
@ApiTags("phone-verification")
@Controller("auth/phone")
export class PhoneVerificationController {
  constructor(private readonly service: PhoneVerificationService) {}

  @Get("config")
  @ApiOperation({ summary: "Allowed countries and whether verification is required" })
  config() {
    return this.service.config();
  }

  @Post("send-code")
  @HttpCode(200)
  // Per-request burst limit; the SMS limits proper are counted in the ledger.
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Send a verification code by SMS" })
  @ApiResponse({ status: 200, description: "Code sent" })
  @ApiResponse({ status: 400, description: "Invalid number, country not allowed, captcha failed" })
  @ApiResponse({ status: 409, description: "Number already linked to another account" })
  @ApiResponse({ status: 429, description: "Rate limited" })
  sendCode(@CurrentUser() user: User, @Body() dto: SendPhoneCodeDto, @Req() req: Request) {
    return this.service.sendCode(user, dto, req.ip ?? null);
  }

  @Post("verify-code")
  @HttpCode(200)
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Check the SMS code and mark the phone verified" })
  @ApiResponse({ status: 200, description: "Phone verified" })
  @ApiResponse({ status: 400, description: "Wrong or expired code" })
  @ApiResponse({ status: 429, description: "Too many attempts" })
  verifyCode(@CurrentUser() user: User, @Body() dto: VerifyPhoneCodeDto, @Req() req: Request) {
    return this.service.verifyCode(user, dto, req.ip ?? null);
  }
}
