import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { TenantCv } from "../../entities/tenant-cv.entity";
import { User } from "../../entities/user.entity";
import { Preferences } from "../../entities/preferences.entity";
import { UpdateTenantCvDto } from "./dto/update-tenant-cv.dto";
import { TenantCvResponseDto } from "./dto/tenant-cv-response.dto";
import { UserQueryService } from "../users/services/user-query.service";

@Injectable()
export class TenantCvService {
  constructor(
    @InjectRepository(TenantCv)
    private readonly tenantCvRepository: Repository<TenantCv>,
    private readonly userQueryService: UserQueryService
  ) {}

  async getForUser(userId: string): Promise<TenantCvResponseDto> {
    const user = await this.userQueryService.findOneWithProfiles(userId);
    const cv = await this.tenantCvRepository.findOne({
      where: { user_id: userId },
    });
    return this.buildResponse(user, cv);
  }

  async getByShareUuid(shareUuid: string): Promise<TenantCvResponseDto> {
    const cv = await this.tenantCvRepository.findOne({
      where: { share_uuid: shareUuid },
    });

    if (!cv) {
      throw new NotFoundException("Tenant CV not found");
    }

    const user = await this.userQueryService.findOneWithProfiles(cv.user_id);
    return this.buildResponse(user, cv);
  }

  async updateForUser(
    userId: string,
    payload: UpdateTenantCvDto
  ): Promise<TenantCvResponseDto> {
    const user = await this.userQueryService.findOneWithProfiles(userId);
    let cv = await this.tenantCvRepository.findOne({
      where: { user_id: userId },
    });

    if (!cv) {
      cv = this.tenantCvRepository.create({ user_id: userId });
    }

    cv.about_me = payload.about_me ?? cv.about_me;
    cv.headline = payload.headline ?? cv.headline;
    cv.hobbies = payload.hobbies ?? cv.hobbies;
    cv.rent_history = payload.rent_history ?? cv.rent_history;
    cv.kyc_status = payload.kyc_status ?? cv.kyc_status;
    cv.referencing_status = payload.referencing_status ?? cv.referencing_status;

    await this.tenantCvRepository.save(cv);

    return this.buildResponse(user, cv);
  }

  async ensureShareUuid(userId: string): Promise<{ share_uuid: string }> {
    let cv = await this.tenantCvRepository.findOne({
      where: { user_id: userId },
    });
    if (!cv) {
      cv = this.tenantCvRepository.create({ user_id: userId });
    }

    if (!cv.share_uuid) {
      cv.share_uuid = uuidv4();
      await this.tenantCvRepository.save(cv);
    }

    return { share_uuid: cv.share_uuid };
  }

  private buildResponse(user: User, cv?: TenantCv | null): TenantCvResponseDto {
    const preferences = user.preferences as Preferences | undefined;
    const tenantProfile = user.tenantProfile;

    const dateOfBirth = tenantProfile?.date_of_birth;
    const ageYears =
      dateOfBirth instanceof Date
        ? this.calculateAge(dateOfBirth)
        : dateOfBirth
        ? this.calculateAge(new Date(dateOfBirth))
        : null;

    const profile = {
      full_name:
        tenantProfile?.full_name ||
        user.full_name ||
        [tenantProfile?.first_name, tenantProfile?.last_name]
          .filter(Boolean)
          .join(" ") ||
        null,
      avatar_url: user.avatar_url || null,
      email: user.email || null,
      phone: user.phone || null,
      age_years: ageYears,
      nationality: tenantProfile?.nationality || null,
      occupation: tenantProfile?.occupation || null,
      address: tenantProfile?.address || null,
    };

    const meta = {
      headline: cv?.headline || null,
      kyc_status: cv?.kyc_status || null,
      referencing_status: cv?.referencing_status || null,
      move_in_date: preferences?.move_in_date
        ? new Date(preferences.move_in_date as any).toISOString()
        : null,
      move_out_date: preferences?.move_out_date
        ? new Date(preferences.move_out_date as any).toISOString()
        : null,
      created_at: user.created_at ? user.created_at.toISOString() : null,
      smoker: preferences?.smoker || null,
      pets: preferences?.pets
        ? preferences.pets
            .map((p) => (p.size ? `${p.type} (${p.size})` : p.type))
            .join(", ")
        : null,
      tenant_type_labels: preferences?.tenant_types || [],
    };

    const about =
      cv?.about_me ||
      preferences?.additional_info ||
      tenantProfile?.additional_info ||
      null;

    const hobbies =
      cv?.hobbies ?? preferences?.hobbies ?? tenantProfile?.hobbies ?? [];

    return {
      user_id: user.id,
      share_uuid: cv?.share_uuid || null,
      profile,
      meta,
      preferences: preferences || null,
      amenities: preferences?.amenities || [],
      about,
      hobbies,
      rent_history: cv?.rent_history || [],
    };
  }

  private calculateAge(date: Date): number | null {
    if (!date || isNaN(date.getTime())) return null;
    const diff = Date.now() - date.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}

