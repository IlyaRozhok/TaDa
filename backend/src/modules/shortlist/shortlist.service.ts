import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Shortlist } from "../../entities/shortlist.entity";
import { Property } from "../../entities/property.entity";

@Injectable()
export class ShortlistService {
  constructor(
    @InjectRepository(Shortlist)
    private shortlistRepository: Repository<Shortlist>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>
  ) {}

  async addToShortlist(userId: string, propertyId: string): Promise<Shortlist> {
    // Check if property exists
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    // Check if already shortlisted
    const existing = await this.shortlistRepository.findOne({
      where: { userId, propertyId },
    });

    if (existing) {
      throw new ConflictException("Property already in shortlist");
    }

    // Create shortlist entry
    const shortlistEntry = this.shortlistRepository.create({
      userId,
      propertyId,
    });

    return await this.shortlistRepository.save(shortlistEntry);
  }

  async removeFromShortlist(userId: string, propertyId: string): Promise<void> {
    const shortlistEntry = await this.shortlistRepository.findOne({
      where: { userId, propertyId },
    });

    if (!shortlistEntry) {
      throw new NotFoundException("Property not found in shortlist");
    }

    await this.shortlistRepository.remove(shortlistEntry);
  }

  async getUserShortlist(userId: string): Promise<Property[]> {
    const shortlistEntries = await this.shortlistRepository.find({
      where: { userId },
      relations: ["property"],
    });

    return shortlistEntries.map((entry) => entry.property);
  }

  async isPropertyShortlisted(
    userId: string,
    propertyId: string
  ): Promise<boolean> {
    const shortlistEntry = await this.shortlistRepository.findOne({
      where: { userId, propertyId },
    });

    return !!shortlistEntry;
  }

  async getShortlistCount(userId: string): Promise<number> {
    return await this.shortlistRepository.count({
      where: { userId },
    });
  }
}
