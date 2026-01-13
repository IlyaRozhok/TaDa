import { Injectable, BadRequestException } from "@nestjs/common";
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
import { toUserResponse } from "./user.mapper";
import { AdminUpdateUserDto } from "./dto/admin-update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private userProfileService: UserProfileService,
    private userRoleService: UserRoleService,
    private userQueryService: UserQueryService,
    private userAdminService: UserAdminService,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Найти пользователя по ID
   */
  async findOne(id: string): Promise<User> {
    return this.userQueryService.findOneWithProfiles(id);
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
    const result = await this.userQueryService.findAllPaginated(params);
    return {
      ...result,
      users: result.users.map(toUserResponse),
    };
  }

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userQueryService.findOneWithProfiles(id);

    const baseUpdates: Partial<User> = {};
    if (updateUserDto.email) {
      baseUpdates.email = updateUserDto.email.toLowerCase();
    }
    if (updateUserDto.status) {
      baseUpdates.status = updateUserDto.status;
    }
    // Update avatar_url in base user entity
    if (updateUserDto.avatar_url !== undefined) {
      baseUpdates.avatar_url = updateUserDto.avatar_url;
    }
    if (Object.keys(baseUpdates).length > 0) {
      await this.userRepository.update(id, baseUpdates);
    }

    // Обновить базовую информацию пользователя
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.status) user.status = updateUserDto.status;
    if (updateUserDto.avatar_url !== undefined) {
      user.avatar_url = updateUserDto.avatar_url;
    }

    // Обновить профиль в зависимости от роли
    if (user.role === UserRole.Tenant) {
      await this.userProfileService.updateTenantProfile(user, updateUserDto);

      // Обновить предпочтения если нужно
      if (
        updateUserDto.pets !== undefined ||
        updateUserDto.smoker !== undefined ||
        updateUserDto.hobbies
      ) {
        await this.userProfileService.updatePreferences(user, updateUserDto);
      }
    } else if (user.role === UserRole.Operator) {
      await this.userProfileService.updateOperatorProfile(user, updateUserDto);
    }

    // Return fresh entity with relations to reflect saved values
    return this.userQueryService.findOneWithProfiles(id);
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
            console.error("Failed to parse avatar URL for deletion:", urlError);
          }
        }
        
        if (key) {
          await this.s3Service.deleteFile(key);
        }
      } catch (error) {
        console.error("Failed to delete avatar from S3:", error);
        // Continue with account deletion even if avatar deletion fails
      }
    }

    // Удалить все связанные данные
    await this.userProfileService.deleteUserData(user);
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
    return created;
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
