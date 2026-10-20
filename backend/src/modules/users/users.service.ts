import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { User, UserRole } from "../../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserProfileService } from "./services/user-profile.service";
import { UserRoleService } from "./services/user-role.service";
import { UserQueryService } from "./services/user-query.service";
import { UserAdminService } from "./services/user-admin.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { S3Service } from "../../common/services/s3.service";
import { AdminUpdateUserDto } from "./dto/admin-update-user.dto";
import { phoneUpdate } from "@/common/phone/phone";
import {
  NotificationEvents,
  UserContactChangedEvent,
} from "@/modules/notifications/events/notification.events";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private userProfileService: UserProfileService,
    private userRoleService: UserRoleService,
    private userQueryService: UserQueryService,
    private userAdminService: UserAdminService,
    private readonly s3Service: S3Service,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Найти пользователя по ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userQueryService.findOneWithProfiles(id);
    if (user?.avatar_url) {
      user.avatar_url = await this.s3Service.refreshAvatarUrl(user.avatar_url) ?? user.avatar_url;
    }
    return user;
  }

  /**
   * Найти пользователя по email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userQueryService.findByEmail(email);
  }

  /**
   * Получить всех пользователей с пагинацией
   */
  async findAllPaginated(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    search?: string;
    role?: string;
  }) {
    // Возвращаем "сырые" сущности, маппинг в DTO делается в контроллере
    return this.userQueryService.findAllPaginated(params);
  }

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Build the first_name / last_name driven full_name
    const firstName = updateUserDto.first_name;
    const lastName  = updateUserDto.last_name;

    // All profile fields now live directly in the users table
    const updates: Partial<User> = {};

    // The stored contact fields, read once: the phone write, full_name and the
    // contact-changed event below all compare against them.
    const contactTouched =
      updateUserDto.phone !== undefined || firstName !== undefined || lastName !== undefined;
    const current = contactTouched
      ? await this.userRepository.findOne({
          where: { id },
          select: ["id", "phone", "first_name", "last_name"],
        })
      : null;

    // `email` is not writable here — see the note in UpdateUserDto.
    if (updateUserDto.avatar_url !== undefined)  updates.avatar_url = updateUserDto.avatar_url;
    if (firstName !== undefined)                updates.first_name = firstName;
    if (lastName  !== undefined)                updates.last_name  = lastName;
    if (updateUserDto.address !== undefined)    updates.address    = updateUserDto.address;
    // E.164 plus its country; "" clears both (stored as NULL, not ""). A new
    // number loses the old one's SMS verification.
    if (updateUserDto.phone !== undefined) {
      Object.assign(updates, phoneUpdate(updateUserDto.phone, current?.phone));
    }
    if (updateUserDto.nationality !== undefined) updates.nationality = updateUserDto.nationality;
    if (updateUserDto.date_of_birth !== undefined) {
      updates.date_of_birth = updateUserDto.date_of_birth
        ? new Date(updateUserDto.date_of_birth)
        : undefined;
    }

    // Keep full_name in sync
    if (firstName !== undefined || lastName !== undefined) {
      const resolvedFirst = firstName ?? current?.first_name ?? "";
      const resolvedLast  = lastName  ?? current?.last_name  ?? "";
      updates.full_name = `${resolvedFirst} ${resolvedLast}`.trim() || undefined;
    } else if (updateUserDto.full_name !== undefined) {
      updates.full_name = updateUserDto.full_name;
    }

    if (Object.keys(updates).length > 0) {
      await this.userRepository.update(id, updates);
      this.emitContactChanged(id, current, updates);
    }

    // Personal/contact fields are canonical on the users table (updated above).
    // Only preferences-related fields still live on their own entity.
    const preferencesChanged =
      updateUserDto.pets !== undefined ||
      updateUserDto.smoker !== undefined ||
      updateUserDto.hobbies !== undefined;

    if (preferencesChanged) {
      const user = await this.userQueryService.findOneWithProfiles(id);
      const isTenantLike =
        user.role === UserRole.Tenant || user.role === UserRole.Admin;
      if (isTenantLike && user.preferences) {
        await this.userProfileService.updatePreferences(user, updateUserDto);
      }
    }

    return this.userQueryService.findOneWithProfiles(id);
  }

  /**
   * Announce a change to the contact fields the CRM mirrors — only when a
   * value actually differs from what was stored, so a save that changes
   * nothing sends nothing. Fire-and-forget: `emit` returns before any
   * listener runs, so the sync can never fail the profile save.
   */
  private emitContactChanged(
    id: string,
    before: Pick<User, "phone" | "first_name" | "last_name"> | null,
    updates: Partial<User>,
  ): void {
    const differs = (next: string | null | undefined, previous: string | null | undefined) =>
      next !== undefined && (next ?? "").trim() !== (previous ?? "").trim();

    const changed: UserContactChangedEvent["changed"] = [];
    if (differs(updates.phone, before?.phone)) changed.push("phone");
    if (differs(updates.first_name, before?.first_name)) changed.push("first_name");
    if (differs(updates.last_name, before?.last_name)) changed.push("last_name");
    if (changed.length === 0) return;

    this.eventEmitter.emit(NotificationEvents.UserContactChanged, {
      userId: id,
      changed,
      changedAt: new Date().toISOString(),
    } satisfies UserContactChangedEvent);
  }

  /**
   * Удалить аккаунт пользователя
   */
  async deleteAccount(id: string): Promise<void> {
    const user = await this.userQueryService.findOneForDeletion(id);

    // Delete avatar from S3 if exists
    if (user.avatar_url) {
      try {
        const url = user.avatar_url;
        
        // Extract S3 key from URL
        let key: string | null = null;
        
        if (url.includes('/uploads/')) {
          // Local dev mode - extract path after /uploads/
          const keyMatch = url.match(/\/uploads\/(.+)$/);
          if (keyMatch && keyMatch[1]) {
            key = keyMatch[1];
          }
        } else {
          // S3 URL - try to extract key
          try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            const keyIndex = pathParts.findIndex(part => part === 'tada-media' || part === 'avatars');
            if (keyIndex !== -1) {
              key = pathParts.slice(keyIndex).join('/');
            } else if (pathParts.length > 0) {
              // Fallback: use all path parts
              key = pathParts.join('/');
            }
          } catch (urlError) {
            this.logger.error("Failed to parse avatar URL for deletion", urlError?.stack ?? String(urlError));
          }
        }
        
        if (key) {
          await this.s3Service.deleteFile(key);
        }
      } catch (error) {
        this.logger.error("Failed to delete avatar from S3", error?.stack ?? String(error));
        // Continue with account deletion even if avatar deletion fails
      }
    }

    // One deletion path for admin and self-service alike: refuses accounts
    // that own listings or hold a live tenancy, and reverts the property
    // lifecycle for deals the cascading booking rows abandon.
    await this.userAdminService.removeUserSafely(user);
  }

  /**
   * Изменить роль пользователя
   */
  async updateUserRole(userId: string, role: UserRole | string): Promise<User> {
    return this.userRoleService.updateUserRole(userId, role);
  }

  // Административные методы

  /**
   * Создать пользователя (админ)
   */
  async adminCreateUser(dto: CreateUserDto): Promise<User> {
    const created = await this.userAdminService.createUser(dto);

    // Вернуть пользователя с загруженными профилями, чтобы маппер
    // мог корректно отдать is_private_landlord и другие связанные поля
    return this.userQueryService.findOneWithProfiles(created.id);
  }

  /**
   * Обновить пользователя (админ)
   */
  async adminUpdateUser(id: string, dto: AdminUpdateUserDto): Promise<User> {
    return this.userAdminService.updateUser(id, dto);
  }

  /**
   * Удалить пользователя (админ)
   */
  async adminDeleteUser(id: string): Promise<void> {
    return this.userAdminService.deleteUser(id);
  }

  /**
   * Изменить роль пользователя (админ)
   */
  async adminChangeUserRole(
    userId: string,
    newRole: UserRole | string
  ): Promise<User> {
    return this.userAdminService.changeUserRole(userId, newRole);
  }

  /**
   * Upload and set user avatar
   */
  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    if (!this.s3Service.isValidFileType(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Only images are allowed."
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException("File too large. Maximum size is 5MB.");
    }

    const fileKey = this.s3Service.generateFileKey(
      file.originalname,
      "avatars"
    );

    const s3Result = await this.s3Service.uploadFile(
      file.buffer,
      fileKey,
      file.mimetype,
      file.originalname
    );

    await this.userRepository.update(userId, {
      avatar_url: s3Result.url,
    });

    return this.userQueryService.findOneWithProfiles(userId);
  }
}
