import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../entities/user.entity";
import { TenantProfile } from "../../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../../entities/operator-profile.entity";
import { Preferences } from "../../../entities/preferences.entity";
import { UpdateUserDto } from "../dto/update-user.dto";

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>
  ) {}

  async updatePreferences(
    user: User,
    updateUserDto: UpdateUserDto
  ): Promise<void> {
    if (!user.preferences) {
      throw new NotFoundException("Preferences not found");
    }

    const preferences = user.preferences;

    if (updateUserDto.pets !== undefined) {
      // Convert string pet type to Pet[] format
      if (updateUserDto.pets === "none" || updateUserDto.pets === "") {
        preferences.pets = [];
        preferences.pet_policy = false;
      } else {
        preferences.pets = [
          { type: updateUserDto.pets as "dog" | "cat" | "other" },
        ];
        preferences.pet_policy = true;
      }
    }
    if (updateUserDto.smoker !== undefined) {
      preferences.smoker = updateUserDto.smoker ? "yes" : "no";
    }
    if (updateUserDto.hobbies) preferences.hobbies = updateUserDto.hobbies;

    await this.preferencesRepository.save(preferences);
  }

  async deleteUserData(user: User): Promise<void> {
    // Delete preferences
    if (user.preferences) {
      await this.preferencesRepository.remove(user.preferences);
    }

    // Delete tenant profile
    if (user.tenantProfile) {
      await this.tenantProfileRepository.remove(user.tenantProfile);
    }

    // Delete operator profile
    if (user.operatorProfile) {
      await this.operatorProfileRepository.remove(user.operatorProfile);
    }
  }
}
