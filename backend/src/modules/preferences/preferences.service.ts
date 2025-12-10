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

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tenantCvService: TenantCvService
  ) {}

  /**
   * Transform DTO to entity format
   * Handles date conversions and field normalization
   */
  private transformDtoToEntity(
    dto: CreatePreferencesDto | UpdatePreferencesDto
  ): Partial<Preferences> {
    // Create a copy without date fields first
    const { move_in_date, move_out_date, ...rest } = dto;
    const data: Partial<Preferences> = { ...rest };

    // Handle move_in_date conversion
    if (move_in_date) {
      data.move_in_date = new Date(move_in_date);
    } else if (dto.hasOwnProperty("move_in_date") && move_in_date === null) {
      data.move_in_date = null;
    }

    // Handle move_out_date conversion
    if (move_out_date) {
      data.move_out_date = new Date(move_out_date);
    } else if (dto.hasOwnProperty("move_out_date") && move_out_date === null) {
      data.move_out_date = null;
    }

    // If move_out_date equals move_in_date, set it to null (single date selection)
    if (
      data.move_in_date &&
      data.move_out_date &&
      data.move_in_date instanceof Date &&
      data.move_out_date instanceof Date &&
      data.move_in_date.getTime() === data.move_out_date.getTime()
    ) {
      data.move_out_date = null;
    }

    return data;
  }

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

    let existingPreferences = await this.preferencesRepository.findOne({
      where: { user: { id: userId } },
    });

    const preferencesData = this.transformDtoToEntity(preferencesDto);

    if (existingPreferences) {
      Object.assign(existingPreferences, preferencesData);
      try {
        const result = await this.preferencesRepository.save(
          existingPreferences
        );
        await this.tenantCvService.ensureShareUuid(userId);
        return result;
      } catch (error) {
        console.error("❌ Error updating preferences:", error);
        throw error;
      }
    } else {
      const preferences = this.preferencesRepository.create({
        ...preferencesData,
        user,
      });

      try {
        const savedPreferences = await this.preferencesRepository.save(
          preferences
        );

        // Update user's preferences relation
        user.preferences = savedPreferences;
        await this.userRepository.save(user);

        await this.tenantCvService.ensureShareUuid(userId);

        return savedPreferences;
      } catch (error) {
        console.error("❌ Error creating new preferences:", error);
        throw error;
      }
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
        `tenantProfile.full_name ILIKE :search 
         OR operatorProfile.full_name ILIKE :search 
         OR user.email ILIKE :search 
         OR preferences.preferred_address ILIKE :search
         OR preferences.primary_postcode ILIKE :search`,
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

    const updateData = this.transformDtoToEntity(updatePreferencesDto);

    // Preserve existing dates if not provided in update
    if (!updatePreferencesDto.hasOwnProperty("move_in_date")) {
      updateData.move_in_date = preferences.move_in_date;
    }
    if (!updatePreferencesDto.hasOwnProperty("move_out_date")) {
      updateData.move_out_date = preferences.move_out_date;
    }

    Object.assign(preferences, updateData);

    try {
      const result = await this.preferencesRepository.save(preferences);
      await this.tenantCvService.ensureShareUuid(userId);
      return result;
    } catch (error) {
      console.error("❌ Error saving preferences:", error);
      throw error;
    }
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
      deposit_preference: null,
      property_types: [],
      bedrooms: [],
      bathrooms: [],
      furnishing: [],
      outdoor_space: null,
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
      is_concierge: null,
      smoking_area: null,
      hobbies: [],
      ideal_living_environment: [],
      smoker: null,
      additional_info: null,
      // Legacy fields
      primary_postcode: null,
      secondary_location: null,
      commute_location: null,
      commute_time_walk: null,
      commute_time_cycle: null,
      commute_time_tube: null,
      min_bedrooms: null,
      max_bedrooms: null,
      min_bathrooms: null,
      max_bathrooms: null,
      property_type: [],
      building_style: [],
      designer_furniture: null,
      house_shares: null,
      date_property_added: null,
      lifestyle_features: [],
      social_features: [],
      work_features: [],
      convenience_features: [],
      pet_friendly_features: [],
      luxury_features: [],
    };

    Object.assign(preferences, clearedPreferences);
    await this.preferencesRepository.save(preferences);
  }
}
