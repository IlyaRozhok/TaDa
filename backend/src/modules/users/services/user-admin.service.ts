import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EntityManager, In, Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserRole, UserStatus } from "@/entities/user.entity";
import { TenantProfile } from "@/entities/tenant-profile.entity";
import { OperatorProfile } from "@/entities/operator-profile.entity";
import { Property, PropertyStatus } from "@/entities/property.entity";
import { Building } from "@/entities/building.entity";
import {
  BOOKING_UNDER_OFFER_STAGES,
  BookingRequest,
  BookingRequestStatus,
} from "@/entities/booking-request.entity";
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

    // Auth is Google-only: the account becomes reachable when its owner first
    // signs in with this email (googleAuth links by verified email). A
    // password is stored only if explicitly supplied — nothing reads it today.
    const hashedPassword = password
      ? await bcrypt.hash(password, USER_CONSTANTS.PASSWORD_SALT_ROUNDS)
      : undefined;

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
   * Delete a user as an admin.
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.removeUserSafely(user);
  }

  /**
   * The one deletion path for a user row, shared with the self-service
   * `UsersService.deleteAccount`. Profiles, CV, shortlist entries and
   * booking requests still go with the row via ON DELETE CASCADE, but two
   * things are refused and one is compensated:
   *
   * - An account that OWNS properties or buildings is not deletable: the
   *   operator FKs used to cascade, so one admin click on "delete user"
   *   irreversibly wiped the operator's whole catalogue and every tenant's
   *   booking history on it. The DB now RESTRICTs those FKs; this guard
   *   turns the constraint violation into an actionable 409.
   * - A tenant with a `rented` booking is a live tenancy record; deleting
   *   the account would erase it. Close or cancel the tenancy first.
   * - A tenant mid-deal (contract..move_in) may leave, but their booking
   *   rows vanish with them — so the property lifecycle is reverted in the
   *   same transaction, exactly as a cancel transition would have done.
   *   Without this the property stayed `under_offer` forever, invisible on
   *   the market with zero symptom.
   */
  async removeUserSafely(user: User): Promise<void> {
    const manager = this.userRepository.manager;

    const [ownedProperties, ownedBuildings] = await Promise.all([
      manager.count(Property, { where: { operator_id: user.id } }),
      manager.count(Building, { where: { operator_id: user.id } }),
    ]);
    if (ownedProperties > 0 || ownedBuildings > 0) {
      throw new ConflictException(
        `This account owns ${ownedProperties} propert${ownedProperties === 1 ? "y" : "ies"} ` +
          `and ${ownedBuildings} building${ownedBuildings === 1 ? "" : "s"}. ` +
          "Reassign or delete them first — deleting the account would destroy " +
          "the listings and their booking history.",
      );
    }

    const liveTenancies = await manager.count(BookingRequest, {
      where: { tenant_id: user.id, status: BookingRequestStatus.Rented },
    });
    if (liveTenancies > 0) {
      throw new ConflictException(
        "This account has an active tenancy (a booking in the rented state). " +
          "Close or cancel the tenancy first — deleting the account would erase " +
          "the tenancy record.",
      );
    }

    await manager.transaction(async (em) => {
      const activeDeals = await em.find(BookingRequest, {
        where: {
          tenant_id: user.id,
          status: In(BOOKING_UNDER_OFFER_STAGES),
        },
        select: ["property_id"],
      });

      // DB-level cascades take the bookings with the row.
      await em.delete(User, user.id);

      const affectedProperties = [
        ...new Set(activeDeals.map((deal) => deal.property_id)),
      ];
      for (const propertyId of affectedProperties) {
        const stillUnderOffer = await em.count(BookingRequest, {
          where: {
            property_id: propertyId,
            status: In(BOOKING_UNDER_OFFER_STAGES),
          },
        });
        if (stillUnderOffer === 0) {
          await em.update(
            Property,
            { id: propertyId, status: PropertyStatus.UnderOffer },
            { status: PropertyStatus.Listed },
          );
        }
      }
    });
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
