import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { TenantCv } from "../../entities/tenant-cv.entity";
import { UpdateTenantCvDto } from "./dto/update-tenant-cv.dto";
import { TenantCvResponseDto } from "./dto/tenant-cv-response.dto";
import { UserQueryService } from "../users/services/user-query.service";
import { buildTenantCvResponse } from "./tenant-cv.mapper";

@Injectable()
export class TenantCvService {
  constructor(
    @InjectRepository(TenantCv)
    private readonly tenantCvRepository: Repository<TenantCv>,
    private readonly userQueryService: UserQueryService
  ) {}

  async getForUser(userId: string): Promise<TenantCvResponseDto> {
    const user = await this.userQueryService.findOneWithProfiles(userId);
    const cv = await this.findCvByUserId(userId);
    return buildTenantCvResponse(user, cv);
  }

  async getByShareUuid(shareUuid: string): Promise<TenantCvResponseDto> {
    const cv = await this.tenantCvRepository.findOne({
      where: { share_uuid: shareUuid },
    });

    if (!cv) {
      throw new NotFoundException("Tenant CV not found");
    }

    const user = await this.userQueryService.findOneWithProfiles(cv.user_id);
    return buildTenantCvResponse(user, cv);
  }

  async updateForUser(
    userId: string,
    payload: UpdateTenantCvDto
  ): Promise<TenantCvResponseDto> {
    const user = await this.userQueryService.findOneWithProfiles(userId);
    const cv = await this.getOrCreateCv(userId);

    cv.about_me = payload.about_me ?? cv.about_me;
    cv.headline = payload.headline ?? cv.headline;
    cv.hobbies = payload.hobbies ?? cv.hobbies;
    cv.rent_history = payload.rent_history ?? cv.rent_history;
    cv.kyc_status = payload.kyc_status ?? cv.kyc_status;
    cv.referencing_status = payload.referencing_status ?? cv.referencing_status;

    await this.tenantCvRepository.save(cv);

    return buildTenantCvResponse(user, cv);
  }

  async ensureShareUuid(userId: string): Promise<{ share_uuid: string }> {
    const cv = await this.getOrCreateCv(userId);

    if (!cv.share_uuid) {
      cv.share_uuid = uuidv4();
      await this.tenantCvRepository.save(cv);
    }

    return { share_uuid: cv.share_uuid };
  }

  private async findCvByUserId(userId: string) {
    return this.tenantCvRepository.findOne({ where: { user_id: userId } });
  }

  private async getOrCreateCv(userId: string): Promise<TenantCv> {
    const existing = await this.findCvByUserId(userId);
    if (existing) return existing;
    return this.tenantCvRepository.create({ user_id: userId });
  }
}
