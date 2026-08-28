import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { TenantCv } from "../../entities/tenant-cv.entity";
import { UpdateTenantCvDto } from "./dto/update-tenant-cv.dto";
import { TenantCvResponseDto } from "./dto/tenant-cv-response.dto";
import { UserQueryService } from "../users/services/user-query.service";
import { buildTenantCvResponse } from "./tenant-cv.mapper";
import { S3Service } from "../../common/services/s3.service";
import {
  NotificationEvents,
  TenantCvCompletedEvent,
} from "@/modules/notifications/events/notification.events";

@Injectable()
export class TenantCvService {
  constructor(
    @InjectRepository(TenantCv)
    private readonly tenantCvRepository: Repository<TenantCv>,
    private readonly userQueryService: UserQueryService,
    private readonly s3Service: S3Service,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async getForUser(userId: string): Promise<TenantCvResponseDto> {
    const user = await this.userQueryService.findOneWithProfiles(userId);
    const cv = await this.findCvByUserId(userId);
    return this.withRefreshedAvatarUrl(buildTenantCvResponse(user, cv));
  }

  async getByShareUuid(
    shareUuid: string,
    options: { maskContacts?: boolean } = {},
  ): Promise<TenantCvResponseDto> {
    const cv = await this.tenantCvRepository.findOne({
      where: { share_uuid: shareUuid },
    });

    if (!cv) {
      throw new NotFoundException("Tenant CV not found");
    }

    const user = await this.userQueryService.findOneWithProfiles(cv.user_id);
    return this.withRefreshedAvatarUrl(
      buildTenantCvResponse(user, cv, { maskContacts: options.maskContacts }),
    );
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
    // kyc_status / referencing_status are deliberately NOT written here:
    // trust badges are admin-set only (setVerification below).

    await this.tenantCvRepository.save(cv);

    return this.withRefreshedAvatarUrl(buildTenantCvResponse(user, cv));
  }

  /**
   * Admin-only write path for the verification badges. Kept separate from
   * the tenant's own update so the two can never be conflated by a DTO
   * change again.
   */
  async setVerification(
    userId: string,
    payload: { kyc_status?: string; referencing_status?: string }
  ): Promise<TenantCvResponseDto> {
    const user = await this.userQueryService.findOneWithProfiles(userId);
    const cv = await this.getOrCreateCv(userId);

    cv.kyc_status = payload.kyc_status ?? cv.kyc_status;
    cv.referencing_status = payload.referencing_status ?? cv.referencing_status;

    await this.tenantCvRepository.save(cv);

    return this.withRefreshedAvatarUrl(buildTenantCvResponse(user, cv));
  }

  private async withRefreshedAvatarUrl(
    dto: TenantCvResponseDto
  ): Promise<TenantCvResponseDto> {
    const raw = dto.profile?.avatar_url;
    if (!raw) return dto;
    const fresh = await this.s3Service.refreshAvatarUrl(raw);
    if (!fresh || fresh === raw) return dto;
    return {
      ...dto,
      profile: { ...dto.profile, avatar_url: fresh },
    };
  }

  /**
   * Marks onboarding finished. Idempotent by design: the frontend calls this
   * from the Finish step, which a user can reach again by navigating back, and
   * a double-click would otherwise send support a second "CV completed" email.
   *
   * `completed_at` is the guard rather than a dedupe key alone — the write and
   * the event are decided by the same null check, so a repeat call is a no-op
   * in the database as well as in the mailbox.
   */
  async markCompleted(
    userId: string
  ): Promise<{ completed_at: Date; already_completed: boolean }> {
    const cv = await this.getOrCreateCv(userId);

    if (cv.completed_at) {
      return { completed_at: cv.completed_at, already_completed: true };
    }

    cv.completed_at = new Date();
    const saved = await this.tenantCvRepository.save(cv);

    const user = await this.userQueryService.findOneWithProfiles(userId);
    this.eventEmitter.emit(NotificationEvents.TenantCvCompleted, {
      userId,
      email: user.email,
      name: user.full_name ?? null,
    } satisfies TenantCvCompletedEvent);

    return {
      completed_at: saved.completed_at as Date,
      already_completed: false,
    };
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
