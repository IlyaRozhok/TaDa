import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Preferences } from "../../entities/preferences.entity";
import { User, UserRole } from "../../entities/user.entity";
import { CreatePreferencesDto } from "./dto/create-preferences.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { TenantCvService } from "../tenant-cv/tenant-cv.service";
import { toPreferencesEntityPartial } from "./preferences.mapper";

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tenantCvService: TenantCvService
  ) {}

  async upsert(
    userId: string,
    preferencesDto: CreatePreferencesDto
  ): Promise<Preferences> {
    // Check if user is a tenant (not an operator)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      user.role === UserRole.Operator ||
      (user.roles && user.roles.includes("operator"))
    ) {
      throw new ForbiddenException("Only tenants can set preferences");
    }

    const existingPreferences = await this.preferencesRepository.findOne({
      where: { user: { id: userId } },
    });

    const preferencesData = toPreferencesEntityPartial(preferencesDto);

    if (existingPreferences) {
      Object.assign(existingPreferences, preferencesData);
      const result = await this.preferencesRepository.save(existingPreferences);
      await this.tenantCvService.ensureShareUuid(userId);
      return result;
    } else {
      const preferences = this.preferencesRepository.create({
        ...preferencesData,
        user,
      });

      let savedPreferences: Preferences;
      try {
        savedPreferences = await this.preferencesRepository.save(preferences);
      } catch (error) {
        // uq_preferences_user_id violation: a concurrent first save won the
        // check-then-insert race. Fall through to updating the row it created
        // instead of surfacing a 500.
        if ((error as { code?: string })?.code !== "23505") {
          throw error;
        }
        const winner = await this.preferencesRepository.findOne({
          where: { user: { id: userId } },
        });
        if (!winner) {
          throw error;
        }
        Object.assign(winner, preferencesData);
        savedPreferences = await this.preferencesRepository.save(winner);
      }

      user.preferences = savedPreferences;
      await this.userRepository.save(user);

      await this.tenantCvService.ensureShareUuid(userId);

      return savedPreferences;
    }
  }

  async create(
    userId: string,
    createPreferencesDto: CreatePreferencesDto
  ): Promise<Preferences> {
    return this.upsert(userId, createPreferencesDto);
  }

  async findByUserId(userId: string): Promise<Preferences | null> {
    return this.preferencesRepository.findOne({
      where: { user: { id: userId } },
      relations: ["user"],
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{
    preferences: Preferences[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const validPage = Math.max(1, Math.floor(Number(page)) || 1);
    const validLimit = Math.max(
      1,
      Math.min(100, Math.floor(Number(limit)) || 10)
    );

    const queryBuilder = this.preferencesRepository
      .createQueryBuilder("preferences")
      .leftJoinAndSelect("preferences.user", "user")
      .leftJoinAndSelect("user.tenantProfile", "tenantProfile")
      .leftJoinAndSelect("user.operatorProfile", "operatorProfile")
      .orderBy("preferences.created_at", "DESC");

    if (search) {
      queryBuilder.where(
        `user.full_name ILIKE :search
         OR user.email ILIKE :search
         OR preferences.preferred_address ILIKE :search`,
        { search: `%${search}%` }
      );
    }

    const [preferences, total] = await queryBuilder
      .skip((validPage - 1) * validLimit)
      .take(validLimit)
      .getManyAndCount();

    return {
      preferences,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async update(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto
  ): Promise<Preferences> {
    const preferences = await this.findByUserId(userId);

    if (!preferences) {
      throw new NotFoundException("Preferences not found");
    }

    const updateData = toPreferencesEntityPartial(updatePreferencesDto);

    // Preserve existing dates if not provided in update
    if (!Object.prototype.hasOwnProperty.call(updatePreferencesDto, "move_in_date")) {
      updateData.move_in_date = preferences.move_in_date;
    }
    if (!Object.prototype.hasOwnProperty.call(updatePreferencesDto, "move_out_date")) {
      updateData.move_out_date = preferences.move_out_date;
    }

    Object.assign(preferences, updateData);

    const result = await this.preferencesRepository.save(preferences);
    await this.tenantCvService.ensureShareUuid(userId);
    return result;
  }

  async delete(userId: string): Promise<void> {
    const preferences = await this.findByUserId(userId);

    if (!preferences) {
      throw new NotFoundException("Preferences not found");
    }

    await this.preferencesRepository.remove(preferences);
  }

  async clear(userId: string): Promise<void> {
    const preferences = await this.findByUserId(userId);

    if (!preferences) {
      throw new NotFoundException("Preferences not found");
    }

    // `null`, never `undefined`: TypeORM's save() silently DROPS undefined
    // values from the UPDATE, so the old version of this method kept budget,
    // dates, smoker and every other scalar while claiming to have cleared them.
    const clearedPreferences: Partial<Preferences> = {
      // New fields
      preferred_address: null,
      preferred_areas: [],
      preferred_districts: [],
      preferred_metro_stations: [],
      move_in_date: null,
      move_out_date: null,
      min_price: null,
      max_price: null,
      flexible_budget: false,
      property_types: [],
      bedrooms: [],
      bathrooms: [],
      furnishing: [],
      balcony: null,
      terrace: null,
      min_square_meters: null,
      max_square_meters: null,
      building_types: [],
      let_duration: null,
      bills: null,
      tenant_types: [],
      pet_policy: null,
      pets: null,
      number_of_pets: null,
      amenities: [],
      property_amenities: [],
      hobbies: [],
      ideal_living_environment: [],
      smoker: null,
      occupation: null,
      family_status: null,
      children_count: null,
      additional_info: null,
      // Legacy fields
      secondary_location: null,
      min_bedrooms: null,
      max_bedrooms: null,
      min_bathrooms: null,
      max_bathrooms: null,
      designer_furniture: null,
    };

    Object.assign(preferences, clearedPreferences);
    await this.preferencesRepository.save(preferences);
  }
}
