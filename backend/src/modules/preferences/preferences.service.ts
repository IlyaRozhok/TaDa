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

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    @InjectRepository(User)
    private userRepository: Repository<User>
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

    let existingPreferences = await this.preferencesRepository.findOne({
      where: { user: { id: userId } },
    });

    const moveInDate = preferencesDto.move_in_date
      ? new Date(preferencesDto.move_in_date)
      : undefined;

    let moveOutDate = preferencesDto.move_out_date
      ? new Date(preferencesDto.move_out_date)
      : preferencesDto.hasOwnProperty("move_out_date") &&
        preferencesDto.move_out_date === null
      ? null
      : undefined;

    // If move_out_date is the same as move_in_date, set it to null (single date selection)
    // Only compare if both dates are valid Date objects
    if (
      moveInDate &&
      moveOutDate &&
      moveInDate instanceof Date &&
      moveOutDate instanceof Date &&
      moveInDate.getTime() === moveOutDate.getTime()
    ) {
      moveOutDate = null;
    }

    const preferencesData = {
      ...preferencesDto,
      move_in_date: moveInDate,
      move_out_date: moveOutDate,
    };

    if (existingPreferences) {
      Object.assign(existingPreferences, preferencesData);
      try {
        const result = await this.preferencesRepository.save(
          existingPreferences
        );
        return result;
      } catch (error) {
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
        "tenantProfile.full_name ILIKE :search OR operatorProfile.full_name ILIKE :search OR user.email ILIKE :search OR preferences.primary_postcode ILIKE :search OR preferences.secondary_location ILIKE :search OR preferences.commute_location ILIKE :search",
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

    const moveInDate = updatePreferencesDto.move_in_date
      ? new Date(updatePreferencesDto.move_in_date)
      : preferences.move_in_date;

    let moveOutDate = updatePreferencesDto.move_out_date
      ? new Date(updatePreferencesDto.move_out_date)
      : updatePreferencesDto.hasOwnProperty("move_out_date") &&
        updatePreferencesDto.move_out_date === null
      ? null
      : preferences.move_out_date;

    // If move_out_date is the same as move_in_date, set it to null (single date selection)
    // Only compare if both dates are valid Date objects
    if (
      moveInDate &&
      moveOutDate &&
      moveInDate instanceof Date &&
      moveOutDate instanceof Date &&
      moveInDate.getTime() === moveOutDate.getTime()
    ) {
      moveOutDate = null;
    }

    const updateData = {
      ...updatePreferencesDto,
      move_in_date: moveInDate,
      move_out_date: moveOutDate,
    };

    Object.assign(preferences, updateData);

    try {
      const result = await this.preferencesRepository.save(preferences);
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

    const clearedPreferences = {
      ...preferences,
      primary_postcode: null,
      secondary_location: null,
      commute_location: null,
      commute_time_walk: null,
      commute_time_cycle: null,
      commute_time_tube: null,
      move_in_date: null,
      min_price: null,
      max_price: null,
      min_bedrooms: null,
      max_bedrooms: null,
      min_bathrooms: null,
      max_bathrooms: null,
      furnishing: null,
      let_duration: null,
      property_type: null,
      building_style: null,
      designer_furniture: null,
      house_shares: null,
      date_property_added: null,
      lifestyle_features: null,
      social_features: null,
      work_features: null,
      convenience_features: null,
      pet_friendly_features: null,
      luxury_features: null,
      hobbies: null,
      ideal_living_environment: null,
      pets: null,
      smoker: null,
      additional_info: null,
    };

    await this.preferencesRepository.save(clearedPreferences);
  }
}
