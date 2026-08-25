import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { TenantCvService } from "./tenant-cv.service";
import { UpdateTenantCvDto } from "./dto/update-tenant-cv.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { OptionalJwtAuthGuard } from "@/common/guards/optional-jwt-auth.guard";
import { User } from "@/entities/user.entity";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@/entities/user.entity";

@ApiTags("Tenant CV")
@Controller("tenant-cv")
export class TenantCvController {
  constructor(private readonly tenantCvService: TenantCvService) {}

  @Get("me")
  @ApiBearerAuth()
  async getMyCv(@CurrentUser() user: any) {
    return this.tenantCvService.getForUser(user.id);
  }

  /** Alias for GET /me — any authenticated user (tenant, admin, operator) */
  @Get("current")
  @ApiBearerAuth()
  async getCurrentCv(@CurrentUser() user: any) {
    return this.tenantCvService.getForUser(user.id);
  }

  @Put()
  @ApiBearerAuth()
  async updateMyCv(
    @CurrentUser() user: any,
    @Body() payload: UpdateTenantCvDto,
  ) {
    return this.tenantCvService.updateForUser(user.id, payload);
  }

  /**
   * Finish step of onboarding. Notifies support the first time and only the
   * first time — see `TenantCvService.markCompleted`.
   *
   * Throttled well below the global default because this is one of the three
   * routes that can cause an outbound email: an authenticated tenant hammering
   * it cannot turn into SES spend, even though the idempotency guard already
   * means only the first call would send anything.
   */
  @Post("complete")
  @Roles(UserRole.Tenant)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 3, ttl: 10000 }, long: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Mark tenant onboarding as completed (idempotent)" })
  @ApiResponse({ status: 201, description: "Completion recorded" })
  async completeMyCv(@CurrentUser() user: any) {
    return this.tenantCvService.markCompleted(user.id);
  }

  @Post("share")
  @ApiBearerAuth()
  async createShareLink(@CurrentUser() user: any) {
    return this.tenantCvService.ensureShareUuid(user.id);
  }

  /**
   * The share link: anyone holding the uuid can read the CV — but direct
   * contact details (email, phone, address) are masked unless the viewer is
   * signed in. A leaked link stops being a leaked phone number.
   */
  @Get(":share_uuid")
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  async getPublicCv(
    @Param("share_uuid", ParseUUIDPipe) shareUuid: string,
    @CurrentUser() viewer?: User,
  ) {
    return this.tenantCvService.getByShareUuid(shareUuid, {
      maskContacts: !viewer,
    });
  }
}
