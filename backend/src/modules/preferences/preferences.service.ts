import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
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

    if (user.roles && user.roles.includes("operator")) {
      throw new ForbiddenException("Only tenants can set preferences");
    }

    // Check if preferences already exist
    let existingPreferences = await this.preferencesRepository.findOne({
      where: { user: { id: userId } },
    });

    // Convert date string to Date object if provided
    const preferencesData = {
      ...preferencesDto,
      move_in_date: preferencesDto.move_in_date
        ? new Date(preferencesDto.move_in_date)
        : undefined,
    };

    if (existingPreferences) {
      // Update existing preferences
      Object.assign(existingPreferences, preferencesData);
      return await this.preferencesRepository.save(existingPreferences);
    } else {
      // Create new preferences
      const preferences = this.preferencesRepository.create({
        ...preferencesData,
        user,
      });
      const savedPreferences =
        await this.preferencesRepository.save(preferences);

      // Update user's preferences relation
      user.preferences = savedPreferences;
      await this.userRepository.save(user);

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

  async update(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto
  ): Promise<Preferences> {
    const preferences = await this.findByUserId(userId);

    if (!preferences) {
      throw new NotFoundException("Preferences not found");
    }

    // Convert date string to Date object if provided
    const updateData = {
      ...updatePreferencesDto,
      move_in_date: updatePreferencesDto.move_in_date
        ? new Date(updatePreferencesDto.move_in_date)
        : preferences.move_in_date,
    };

    Object.assign(preferences, updateData);

    return this.preferencesRepository.save(preferences);
  }

  async delete(userId: string): Promise<void> {
    const preferences = await this.findByUserId(userId);

    if (!preferences) {
      throw new NotFoundException("Preferences not found");
    }

    await this.preferencesRepository.remove(preferences);
  }
}
