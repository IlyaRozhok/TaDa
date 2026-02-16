import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Property } from "../../entities/property.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { User, UserRole } from "../../entities/user.entity";

@Injectable()
export class ShortlistService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * Get tenant profile for a user (tenant or admin). Admins are allowed to use shortlist; profile is created on first use if missing.
   */
  private async getTenantProfile(userId: string): Promise<TenantProfile> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== UserRole.Tenant && user.role !== UserRole.Admin) {
      throw new BadRequestException("Only tenants can have shortlists");
    }

    if (user.tenantProfile) {
      return user.tenantProfile;
    }

    // Admin (or tenant without profile): create minimal tenant profile for shortlist storage
    const tenantProfile = this.tenantProfileRepository.create({
      userId: user.id,
      full_name: user.full_name ?? undefined,
      shortlisted_properties: [],
    });
    await this.tenantProfileRepository.save(tenantProfile);
    return tenantProfile;
  }

  async addToShortlist(
    userId: string,
    propertyId: string
  ): Promise<{ success: boolean; message: string }> {
    // Check if property exists
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    // Get tenant profile
    const tenantProfile = await this.getTenantProfile(userId);

    // Initialize shortlisted_properties if null
    const currentShortlist = tenantProfile.shortlisted_properties || [];

    // Check if already shortlisted - if yes, just return success (idempotent operation)
    if (currentShortlist.includes(propertyId)) {
      return {
        success: true,
        message: "Property already in shortlist",
      };
    }

    // Add to shortlist
    const updatedShortlist = [...currentShortlist, propertyId];
    tenantProfile.shortlisted_properties = updatedShortlist;

    await this.tenantProfileRepository.save(tenantProfile);

    return {
      success: true,
      message: "Property added to shortlist successfully",
    };
  }

  async removeFromShortlist(
    userId: string,
    propertyId: string
  ): Promise<{ success: boolean; message: string }> {
    // Get tenant profile
    const tenantProfile = await this.getTenantProfile(userId);

    // Initialize shortlisted_properties if null
    const currentShortlist = tenantProfile.shortlisted_properties || [];

    // Check if property is in shortlist - if not, just return success (idempotent operation)
    if (!currentShortlist.includes(propertyId)) {
      return {
        success: true,
        message: "Property not in shortlist (already removed)",
      };
    }

    // Remove from shortlist
    const updatedShortlist = currentShortlist.filter((id) => id !== propertyId);
    tenantProfile.shortlisted_properties = updatedShortlist;

    await this.tenantProfileRepository.save(tenantProfile);

    return {
      success: true,
      message: "Property removed from shortlist successfully",
    };
  }

  async getUserShortlist(userId: string): Promise<Property[]> {
    // Get tenant profile
    const tenantProfile = await this.getTenantProfile(userId);

    // Get shortlisted property IDs
    const shortlistedPropertyIds = tenantProfile.shortlisted_properties || [];

    if (shortlistedPropertyIds.length === 0) {
      return [];
    }

    // Fetch properties with building and operator relations
    const properties = await this.propertyRepository.find({
      where: { id: In(shortlistedPropertyIds) },
      relations: ["building", "building.operator", "operator"],
      order: { created_at: "DESC" },
    });

    return properties;
  }

  async isPropertyShortlisted(
    userId: string,
    propertyId: string
  ): Promise<boolean> {
    try {
      // Get tenant profile
      const tenantProfile = await this.getTenantProfile(userId);

      // Check if property is in shortlist
      const shortlistedPropertyIds = tenantProfile.shortlisted_properties || [];
      return shortlistedPropertyIds.includes(propertyId);
    } catch (error) {
      // If user is not a tenant or profile doesn't exist, return false
      return false;
    }
  }

  async getShortlistCount(userId: string): Promise<number> {
    try {
      // Get tenant profile
      const tenantProfile = await this.getTenantProfile(userId);

      // Return count of shortlisted properties
      const shortlistedPropertyIds = tenantProfile.shortlisted_properties || [];
      return shortlistedPropertyIds.length;
    } catch (error) {
      // If user is not a tenant or profile doesn't exist, return 0
      return 0;
    }
  }

  async clearShortlist(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    // Get tenant profile
    const tenantProfile = await this.getTenantProfile(userId);

    // Clear shortlist
    tenantProfile.shortlisted_properties = [];

    await this.tenantProfileRepository.save(tenantProfile);

    return {
      success: true,
      message: "Shortlist cleared successfully",
    };
  }
}
