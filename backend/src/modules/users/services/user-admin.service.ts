import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EntityManager, Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserRole, UserStatus } from "@/entities/user.entity";
import { TenantProfile } from "@/entities/tenant-profile.entity";
import { OperatorProfile } from "@/entities/operator-profile.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import { AdminUpdateUserDto } from "../dto/admin-update-user.dto";
import { USER_CONSTANTS } from "@/common/constants/user.constants";
import {
  NotificationEvents,
  UserRegisteredEvent,
} from "@/modules/notifications/events/notification.events";

@Injectable()
export class UserAdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    private eventEmitter: EventEmitter2
  ) {}

  /**
   * Create a user as an admin.
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    const {
      full_name,
      email,
      password,
      role = UserRole.Tenant,
      is_private_landlord = false,
    } = dto;

    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(
      password,
      USER_CONSTANTS.PASSWORD_SALT_ROUNDS
    );

    // User and role profile land or roll back together — a failure between
    // the two writes used to leave a profileless account behind.
    const savedUser = await this.userRepository.manager.transaction(
      async (em) => {
        const user = em.create(User, {
          email: email.toLowerCase(),
          full_name: full_name || undefined,
          password: hashedPassword,
          role: role as UserRole,
          status: UserStatus.Active,
        });

        const saved = await em.save(user);

        if (role === UserRole.Tenant) {
          await this.createTenantProfile(saved, em);
        } else if (role === UserRole.Operator) {
          await this.createOperatorProfile(saved, is_private_landlord, em);
        }

        return saved;
      }
    );

    // An admin-created account is still a registration as far as support is
    // concerned, so it goes through the same event as the Google path.
    this.eventEmitter.emit(NotificationEvents.UserRegistered, {
      userId: savedUser.id,
      email: savedUser.email,
      name: savedUser.full_name ?? null,
      role: savedUser.role,
      createdAt: savedUser.created_at,
      source: "admin_created",
    } satisfies UserRegisteredEvent);

    return savedUser;
  }

  /**
   * Update a user as an admin.
   */
  async updateUser(id: string, dto: AdminUpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (dto.full_name !== undefined) user.full_name = dto.full_name;
    if (dto.email) user.email = dto.email.toLowerCase();
    if (dto.status) user.status = dto.status;
    if (dto.role) user.role = dto.role;

    if (dto.password) {
      user.password = await bcrypt.hash(
        dto.password,
        USER_CONSTANTS.PASSWORD_SALT_ROUNDS
      );
    }

    // User row and profile writes land or roll back together.
    return this.userRepository.manager.transaction(async (em) => {
      // A role change must bring the matching profile with it. This method
      // used to flip `role` alone — the third role-change path in the
      // codebase, and the only one that left e.g. a fresh operator without
      // an OperatorProfile.
      if (user.role === UserRole.Tenant && !user.tenantProfile) {
        await this.createTenantProfile(user, em);
      } else if (user.role === UserRole.Operator && !user.operatorProfile) {
        await this.createOperatorProfile(
          user,
          dto.is_private_landlord ?? false,
          em
        );
      } else if (
        dto.is_private_landlord !== undefined &&
        user.role === UserRole.Operator
      ) {
        user.operatorProfile.is_private_landlord = dto.is_private_landlord;
        await em.save(user.operatorProfile);
      }

      return em.save(user);
    });
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
   * Change a user's role.
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

    return this.userRepository.manager.transaction(async (em) => {
      if (oldRole !== newRole) {
        if (newRole === UserRole.Tenant && !user.tenantProfile) {
          await this.createTenantProfile(user, em);
        } else if (newRole === UserRole.Operator && !user.operatorProfile) {
          await this.createOperatorProfile(user, false, em);
        }
      }

      return em.save(user);
    });
  }

  /**
   * Create a tenant profile.
   */
  private async createTenantProfile(
    user: User,
    em?: EntityManager
  ): Promise<void> {
    const repository = em
      ? em.getRepository(TenantProfile)
      : this.tenantProfileRepository;
    const tenantProfile = repository.create({
      userId: user.id,
      occupation: "",
      industry: "",
      work_style: "",
      ideal_living_environment: "",
      additional_info: "",
      shortlisted_properties: [],
    });

    await repository.save(tenantProfile);
  }

  /**
   * Create an operator profile.
   */
  private async createOperatorProfile(
    user: User,
    isPrivateLandlord: boolean = false,
    em?: EntityManager
  ): Promise<void> {
    const repository = em
      ? em.getRepository(OperatorProfile)
      : this.operatorProfileRepository;
    const operatorProfile = repository.create({
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

    await repository.save(operatorProfile);
  }
}
