import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { TenantCvService } from "./tenant-cv.service";
import { UpdateTenantCvDto } from "./dto/update-tenant-cv.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";

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

  @Post("share")
  @ApiBearerAuth()
  async createShareLink(@CurrentUser() user: any) {
    return this.tenantCvService.ensureShareUuid(user.id);
  }

  /** The share link: anyone holding the uuid can read the CV. */
  @Get(":share_uuid")
  @Public()
  async getPublicCv(@Param("share_uuid") shareUuid: string) {
    return this.tenantCvService.getByShareUuid(shareUuid);
  }
}
