import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { TenantCvService } from "./tenant-cv.service";
import { UpdateTenantCvDto } from "./dto/update-tenant-cv.dto";
import { Auth } from "../../common/decorators/auth.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "../../entities/user.entity";

@ApiTags("Tenant CV")
@Controller("tenant-cv")
export class TenantCvController {
  constructor(private readonly tenantCvService: TenantCvService) {}

  @Get("me")
  @Auth(UserRole.Tenant)
  @ApiBearerAuth()
  async getMyCv(@CurrentUser() user: any) {
    return this.tenantCvService.getForUser(user.id);
  }

  @Put()
  @Auth(UserRole.Tenant)
  @ApiBearerAuth()
  async updateMyCv(
    @CurrentUser() user: any,
    @Body() payload: UpdateTenantCvDto
  ) {
    return this.tenantCvService.updateForUser(user.id, payload);
  }

  @Post("share")
  @Auth(UserRole.Tenant)
  @ApiBearerAuth()
  async createShareLink(@CurrentUser() user: any) {
    return this.tenantCvService.ensureShareUuid(user.id);
  }

  @Get(":share_uuid")
  async getPublicCv(@Param("share_uuid") shareUuid: string) {
    return this.tenantCvService.getByShareUuid(shareUuid);
  }
}

