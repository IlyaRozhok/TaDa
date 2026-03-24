import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../../../entities/user.entity";
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

  async updateTenantProfile(
    user: User,
    updateUserDto: UpdateUserDto
  ): Promise<void> {
    if (!user.tenantProfile) {
      throw new NotFoundException("Tenant profile not found");
    }

    const profile = user.tenantProfile;

    // Update basic profile fields - allow empty strings and null values
    if (updateUserDto.full_name !== undefined) profile.full_name = updateUserDto.full_name;
    if (updateUserDto.first_name !== undefined)
      profile.first_name = updateUserDto.first_name;
    if (updateUserDto.last_name !== undefined)
      profile.last_name = updateUserDto.last_name;
    if (updateUserDto.address !== undefined)
      profile.address = updateUserDto.address;
    if (updateUserDto.phone !== undefined) profile.phone = updateUserDto.phone;
    if (updateUserDto.date_of_birth !== undefined) {
      if (updateUserDto.date_of_birth && updateUserDto.date_of_birth.trim() !== "") {
        profile.date_of_birth = new Date(updateUserDto.date_of_birth);
      } else {
        profile.date_of_birth = null;
      }
    }
    if (updateUserDto.nationality !== undefined)
      profile.nationality = updateUserDto.nationality;
    if (updateUserDto.age_range !== undefined) profile.age_range = updateUserDto.age_range;
    if (updateUserDto.industry !== undefined) profile.industry = updateUserDto.industry;
    if (updateUserDto.work_style !== undefined) profile.work_style = updateUserDto.work_style;
    if (updateUserDto.lifestyle !== undefined) profile.lifestyle = updateUserDto.lifestyle;
    if (updateUserDto.ideal_living_environment !== undefined) {
      profile.ideal_living_environment = updateUserDto.ideal_living_environment;
    }
    if (updateUserDto.additional_info !== undefined)
      profile.additional_info = updateUserDto.additional_info;

    await this.tenantProfileRepository.save(profile);
  }

  /** Mirror personal fields from users table → tenant_profiles (backward compat). */
  async syncTenantProfileFromUser(user: User): Promise<void> {
    if (!user.tenantProfile) return;
    const profile = user.tenantProfile;
    if (user.first_name !== undefined) profile.first_name = user.first_name;
    if (user.last_name  !== undefined) profile.last_name  = user.last_name;
    if (user.address    !== undefined) profile.address    = user.address;
    if (user.phone      !== undefined) profile.phone      = user.phone;
    if (user.nationality !== undefined) profile.nationality = user.nationality;
    if (user.date_of_birth !== undefined) profile.date_of_birth = user.date_of_birth;
    profile.full_name = user.full_name || profile.full_name;
    await this.tenantProfileRepository.save(profile);
  }

  /** Mirror personal fields from users table → operator_profiles (backward compat). */
  async syncOperatorProfileFromUser(user: User): Promise<void> {
    if (!user.operatorProfile) return;
    const profile = user.operatorProfile;
    if (user.first_name !== undefined) (profile as any).first_name = user.first_name;
    if (user.last_name  !== undefined) (profile as any).last_name  = user.last_name;
    if (user.phone      !== undefined) profile.phone  = user.phone;
    profile.full_name = user.full_name || profile.full_name;
    await this.operatorProfileRepository.save(profile);
  }

  async createTenantProfileForUser(
    userId: string,
    updateUserDto: UpdateUserDto
  ): Promise<void> {
    // Create new tenant profile for admin user
    const newProfile = this.tenantProfileRepository.create({
      userId: userId,
      first_name: updateUserDto.first_name || "",
      last_name: updateUserDto.last_name || "",
      full_name: updateUserDto.full_name || "",
      address: updateUserDto.address || "",
      phone: updateUserDto.phone || "",
      date_of_birth: updateUserDto.date_of_birth ? new Date(updateUserDto.date_of_birth) : null,
      nationality: updateUserDto.nationality || "",
      industry: updateUserDto.industry || "",
      work_style: updateUserDto.work_style || "",
      lifestyle: updateUserDto.lifestyle || [],
      ideal_living_environment: updateUserDto.ideal_living_environment || "",
      additional_info: updateUserDto.additional_info || "",
    });

    await this.tenantProfileRepository.save(newProfile);
  }

  async updateOperatorProfile(
    user: User,
    updateUserDto: UpdateUserDto
  ): Promise<void> {
    if (!user.operatorProfile) {
      throw new NotFoundException("Operator profile not found");
    }

    const profile = user.operatorProfile;

    // Update basic profile fields
    if (updateUserDto.full_name) profile.full_name = updateUserDto.full_name;
    if (updateUserDto.phone) profile.phone = updateUserDto.phone;
    if (
      updateUserDto.date_of_birth &&
      updateUserDto.date_of_birth.trim() !== ""
    ) {
      profile.date_of_birth = new Date(updateUserDto.date_of_birth);
    }
    if (updateUserDto.nationality)
      profile.nationality = updateUserDto.nationality;
    if (updateUserDto.company_name)
      profile.company_name = updateUserDto.company_name;
    if (updateUserDto.business_address)
      profile.business_address = updateUserDto.business_address;
    if (updateUserDto.business_description) {
      profile.business_description = updateUserDto.business_description;
    }

    await this.operatorProfileRepository.save(profile);
  }

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

  async createTenantProfile(
    userId: string,
    fullName?: string
  ): Promise<TenantProfile> {
    const profile = this.tenantProfileRepository.create({
      userId,
      full_name: fullName,
    });
    return await this.tenantProfileRepository.save(profile);
  }

  async createOperatorProfile(
    userId: string,
    fullName?: string
  ): Promise<OperatorProfile> {
    const profile = this.operatorProfileRepository.create({
      userId,
      full_name: fullName,
    });
    return await this.operatorProfileRepository.save(profile);
  }

  async createPreferences(userId: string): Promise<Preferences> {
    const preferences = this.preferencesRepository.create({
      user_id: userId,
    });
    return await this.preferencesRepository.save(preferences);
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
