import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserRole, UserStatus } from "@/entities/user.entity";
import { TenantProfile } from "@/entities/tenant-profile.entity";
import { OperatorProfile } from "@/entities/operator-profile.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import { AdminUpdateUserDto } from "../dto/admin-update-user.dto";
import { USER_CONSTANTS } from "@/common/constants/user.constants";

@Injectable()
export class UserAdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>
  ) {}

  /**
   * Создать пользователя администратором
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    const {
      full_name,
      email,
      password,
      role = UserRole.Tenant,
      is_private_landlord = false,
    } = dto;

    // Проверить, что email уникален
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    // Захешировать пароль
    const hashedPassword = await bcrypt.hash(
      password,
      USER_CONSTANTS.PASSWORD_SALT_ROUNDS
    );

    // Создать пользователя
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      full_name: full_name || undefined,
      password: hashedPassword,
      role: role as UserRole,
      status: UserStatus.Active,
    });

    const saved = await this.userRepository.save(user);
    const savedUser = Array.isArray(saved) ? saved[0] : saved;

    // Создать профиль в зависимости от роли
    if (role === UserRole.Tenant) {
      await this.createTenantProfile(savedUser);
    } else if (role === UserRole.Operator) {
      await this.createOperatorProfile(savedUser, is_private_landlord);
    }

    return savedUser;
  }

  /**
   * Обновить пользователя администратором
   */
  async updateUser(id: string, dto: AdminUpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Обновить базовую информацию
    if (dto.full_name !== undefined) user.full_name = dto.full_name;
    if (dto.email) user.email = dto.email.toLowerCase();
    if (dto.status) user.status = dto.status;
    if (dto.role) user.role = dto.role;

    // Обновить пароль если предоставлен
    if (dto.password) {
      user.password = await bcrypt.hash(
        dto.password,
        USER_CONSTANTS.PASSWORD_SALT_ROUNDS
      );
    }

    // Обновить признак частного лендлорда для оператора
    if (dto.is_private_landlord !== undefined) {
      if (user.role === UserRole.Operator) {
        if (!user.operatorProfile) {
          await this.createOperatorProfile(user, dto.is_private_landlord);
        } else {
          user.operatorProfile.is_private_landlord = dto.is_private_landlord;
          await this.operatorProfileRepository.save(user.operatorProfile);
        }
      }
    }

    return this.userRepository.save(user);
  }

  /**
   * Delete a user as an admin. Children are not removed by hand: every table
   * that references `users.id` does so with ON DELETE CASCADE, so dropping the
   * user row takes the profiles, CV, shortlist entries, buildings, properties
   * and booking requests with it. This is the same mechanism the self-service
   * path in `UsersService.deleteAccount` relies on.
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.userRepository.remove(user);
  }

  /**
   * Изменить роль пользователя
   */
  async changeUserRole(
    userId: string,
    newRole: UserRole | string
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile", "operatorProfile"],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const oldRole = user.role;
    user.role = newRole as UserRole;

    // Если роль изменилась, обновить профили
    if (oldRole !== newRole) {
      if (newRole === UserRole.Tenant && !user.tenantProfile) {
        await this.createTenantProfile(user);
      } else if (newRole === UserRole.Operator && !user.operatorProfile) {
        await this.createOperatorProfile(user);
      }
    }

    return this.userRepository.save(user);
  }

  /**
   * Создать профиль арендатора
   */
  private async createTenantProfile(user: User): Promise<void> {
    const tenantProfile = this.tenantProfileRepository.create({
      userId: user.id,
      occupation: "",
      industry: "",
      work_style: "",
      ideal_living_environment: "",
      additional_info: "",
      shortlisted_properties: [],
    });

    await this.tenantProfileRepository.save(tenantProfile);
  }

  /**
   * Создать профиль оператора
   */
  private async createOperatorProfile(
    user: User,
    isPrivateLandlord: boolean = false
  ): Promise<void> {
    const operatorProfile = this.operatorProfileRepository.create({
      userId: user.id,
      company_name: "",
      business_address: "",
      company_registration: "",
      vat_number: "",
      license_number: "",
      years_experience: undefined,
      business_description: "",
      website: "",
      linkedin: "",
      is_private_landlord: isPrivateLandlord,
    });

    await this.operatorProfileRepository.save(operatorProfile);
  }
}
