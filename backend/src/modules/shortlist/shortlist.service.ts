import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Property } from "@/entities/property.entity";
import { Shortlist } from "@/entities/shortlist.entity";
import { User, UserRole } from "@/entities/user.entity";
import { S3Service } from "@/common/services/s3.service";
import { stripOperatorPii } from "@/common/mappers/public-operator.mapper";

/**
 * Shortlist reads and writes go through the `shortlist` table — one row per
 * (user, property) under the `unique_user_property` constraint. The table
 * existed since InitialSchema but was dead code: the service used to
 * read-modify-write a jsonb array on `tenant_profiles`, which lost concurrent
 * updates and enforced no FK. Migration 1787310000000 backfilled the table
 * from that array; the array column is frozen and slated for removal once the
 * table is verified in production.
 */
@Injectable()
export class ShortlistService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    @InjectRepository(Shortlist)
    private shortlistRepository: Repository<Shortlist>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly s3Service: S3Service
  ) {}

  /** Shortlists belong to tenants; admins may use one too (unchanged rule). */
  private async assertShortlistUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== UserRole.Tenant && user.role !== UserRole.Admin) {
      throw new BadRequestException("Only tenants can have shortlists");
    }
  }

  async addToShortlist(
    userId: string,
    propertyId: string
  ): Promise<{ success: boolean; message: string }> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    await this.assertShortlistUser(userId);

    // `ON CONFLICT DO NOTHING` instead of check-then-insert: two tabs adding
    // the same property race to one row, and the constraint settles it. The
    // old array implementation lost one of the two writes entirely.
    const result = await this.shortlistRepository
      .createQueryBuilder()
      .insert()
      .into(Shortlist)
      .values({ userId, propertyId })
      .orIgnore()
      .execute();

    const inserted = (result.identifiers ?? []).filter(Boolean).length > 0;
    return {
      success: true,
      message: inserted
        ? "Property added to shortlist successfully"
        : "Property already in shortlist",
    };
  }

  async removeFromShortlist(
    userId: string,
    propertyId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.assertShortlistUser(userId);

    const result = await this.shortlistRepository.delete({
      userId,
      propertyId,
    });

    return {
      success: true,
      message:
        (result.affected ?? 0) > 0
          ? "Property removed from shortlist successfully"
          : "Property not in shortlist (already removed)",
    };
  }

  private async updatePhotosUrls(property: Property): Promise<Property> {
    return this.s3Service.refreshMediaUrls(property, {
      arrayFields: ["photos"],
    });
  }

  async getUserShortlist(userId: string): Promise<Property[]> {
    await this.assertShortlistUser(userId);

    // Most recently shortlisted first — the table has the timestamp the
    // array never carried (the old code could only sort by property age).
    const entries = await this.shortlistRepository.find({
      where: { userId },
      order: { created_at: "DESC" },
      select: ["propertyId"],
    });

    if (entries.length === 0) {
      return [];
    }

    const orderedIds = entries.map((entry) => entry.propertyId);
    const properties = await this.propertyRepository.find({
      where: { id: In(orderedIds) },
      relations: ["building", "building.operator", "operator"],
    });
    const byId = new Map(properties.map((p) => [p.id, p]));

    // Refresh presigned URLs for photos so images load in the frontend,
    // and strip operator PII — this response goes to tenants.
    return Promise.all(
      orderedIds
        .filter((id) => byId.has(id))
        .map((id) => this.updatePhotosUrls(byId.get(id)!).then(stripOperatorPii)),
    );
  }

  async isPropertyShortlisted(
    userId: string,
    propertyId: string
  ): Promise<boolean> {
    try {
      await this.assertShortlistUser(userId);
      const count = await this.shortlistRepository.countBy({
        userId,
        propertyId,
      });
      return count > 0;
    } catch {
      // Not a tenant / no such user — same "false" the old code answered.
      return false;
    }
  }

  async getShortlistCount(userId: string): Promise<number> {
    try {
      await this.assertShortlistUser(userId);
      return await this.shortlistRepository.countBy({ userId });
    } catch {
      return 0;
    }
  }

  async clearShortlist(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.assertShortlistUser(userId);

    await this.shortlistRepository.delete({ userId });

    return {
      success: true,
      message: "Shortlist cleared successfully",
    };
  }
}
