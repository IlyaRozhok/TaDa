import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { TenantCvService } from "./tenant-cv.service";
import { UpdateTenantCvDto } from "./dto/update-tenant-cv.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Tenant CV")
@Controller("tenant-cv")
export class TenantCvController {
  constructor(private readonly tenantCvService: TenantCvService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyCv(@CurrentUser() user: any) {
    return this.tenantCvService.getForUser(user.id);
  }

  /** Alias for GET /me — any authenticated user (tenant, admin, operator) */
  @Get("current")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getCurrentCv(@CurrentUser() user: any) {
    return this.tenantCvService.getForUser(user.id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMyCv(
    @CurrentUser() user: any,
    @Body() payload: UpdateTenantCvDto,
  ) {
    return this.tenantCvService.updateForUser(user.id, payload);
  }

  @Post("share")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createShareLink(@CurrentUser() user: any) {
    return this.tenantCvService.ensureShareUuid(user.id);
  }

  @Get(":share_uuid")
  async getPublicCv(@Param("share_uuid") shareUuid: string) {
    return this.tenantCvService.getByShareUuid(shareUuid);
  }
}
