import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Property } from "../../entities/property.entity";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { MatchingService } from "../matching/matching.service";
import { Favourite } from "../../entities/favourite.entity";
import { Shortlist } from "../../entities/shortlist.entity";
import { User } from "../../entities/user.entity";

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Favourite)
    private readonly favouriteRepository: Repository<Favourite>,
    @InjectRepository(Shortlist)
    private readonly shortlistRepository: Repository<Shortlist>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly matchingService: MatchingService
  ) {}

  async create(
    createPropertyDto: CreatePropertyDto,
    operatorId: string
  ): Promise<Property> {
    const property = this.propertyRepository.create({
      ...createPropertyDto,
      operator_id: operatorId,
    });

    return await this.propertyRepository.save(property);
  }

  async update(
    id: string,
    updatePropertyDto: Partial<CreatePropertyDto>,
    operatorId: string
  ): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    // Check if the operator owns this property
    if (property.operator_id !== operatorId) {
      throw new ForbiddenException("You can only update your own properties");
    }

    // Update the property
    await this.propertyRepository.update(id, updatePropertyDto);

    // Return the updated property
    return await this.propertyRepository.findOne({
      where: { id },
      relations: ["operator"],
    });
  }

  async findByOperator(operatorId: string): Promise<Property[]> {
    return await this.propertyRepository.find({
      where: { operator_id: operatorId },
      relations: ["operator"],
      order: { created_at: "DESC" },
    });
  }

  async findFeaturedProperties(limit: number = 6): Promise<Property[]> {
    return await this.propertyRepository.find({
      relations: ["operator"],
      order: { created_at: "DESC" },
      take: limit,
    });
  }

  async findMatchedProperties(
    tenantId: string,
    limit: number = 6
  ): Promise<Property[]> {
    // Use the advanced matching service
    return await this.matchingService.findMatchedProperties(tenantId, limit);
  }

  async findAll(): Promise<Property[]> {
    return await this.propertyRepository.find({
      relations: ["operator"],
      order: { created_at: "DESC" },
    });
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ["operator"],
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    return property;
  }

  async remove(id: string, operatorId: string): Promise<void> {
    const property = await this.propertyRepository.findOne({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    // Check if the operator owns this property
    if (property.operator_id !== operatorId) {
      throw new ForbiddenException("You can only delete your own properties");
    }

    await this.propertyRepository.delete(id);
  }

  async getInterestedTenants(propertyId: string, operatorId: string) {
    // First verify the property belongs to this operator
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    if (property.operator_id !== operatorId) {
      throw new ForbiddenException(
        "You can only view tenants for your own properties"
      );
    }

    // Get tenants who favourited this property
    const favourites = await this.favouriteRepository.find({
      where: { propertyId },
      relations: ["user"],
    });

    // Get tenants who shortlisted this property
    const shortlists = await this.shortlistRepository.find({
      where: { propertyId },
      relations: ["user"],
    });

    // Combine and deduplicate tenants
    const tenantMap = new Map();

    favourites.forEach((fav) => {
      if (fav.user && !fav.user.is_operator) {
        tenantMap.set(fav.user.id, {
          user: {
            id: fav.user.id,
            email: fav.user.email,
            full_name: fav.user.full_name,
            phone: fav.user.phone,
            created_at: fav.user.created_at,
          },
          interactions: {
            favourited: true,
            favourited_at: fav.created_at,
            shortlisted: false,
            shortlisted_at: null,
          },
        });
      }
    });

    shortlists.forEach((short) => {
      if (short.user && !short.user.is_operator) {
        const existing = tenantMap.get(short.user.id);
        if (existing) {
          existing.interactions.shortlisted = true;
          existing.interactions.shortlisted_at = short.created_at;
        } else {
          tenantMap.set(short.user.id, {
            user: {
              id: short.user.id,
              email: short.user.email,
              full_name: short.user.full_name,
              phone: short.user.phone,
              created_at: short.user.created_at,
            },
            interactions: {
              favourited: false,
              favourited_at: null,
              shortlisted: true,
              shortlisted_at: short.created_at,
            },
          });
        }
      }
    });

    return {
      property: {
        id: property.id,
        title: property.title,
        address: property.address,
        price: property.price,
      },
      interested_tenants: Array.from(tenantMap.values()),
      total_count: tenantMap.size,
    };
  }

  async getOperatorStatistics(operatorId: string) {
    // Get total properties for this operator
    const propertiesCount = await this.propertyRepository.count({
      where: { operator_id: operatorId },
    });

    // Get properties owned by this operator
    const properties = await this.propertyRepository.find({
      where: { operator_id: operatorId },
      select: ["id"],
    });

    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return {
        properties: 0,
        tenants: 0,
        total_interactions: 0,
        estimated_revenue: 0,
      };
    }

    // Get unique tenants who interacted with operator's properties
    const uniqueTenantIds = new Set<string>();

    // Get favourites for operator's properties
    const favourites = await this.favouriteRepository.find({
      where: { propertyId: In(propertyIds) },
      relations: ["user"],
    });

    favourites.forEach((fav) => {
      if (fav.user && !fav.user.is_operator) {
        uniqueTenantIds.add(fav.user.id);
      }
    });

    // Get shortlists for operator's properties
    const shortlists = await this.shortlistRepository.find({
      where: { propertyId: In(propertyIds) },
      relations: ["user"],
    });

    shortlists.forEach((short) => {
      if (short.user && !short.user.is_operator) {
        uniqueTenantIds.add(short.user.id);
      }
    });

    // Calculate total interactions
    const totalInteractions = favourites.length + shortlists.length;

    // Calculate estimated revenue from all properties
    const propertiesWithPrice = await this.propertyRepository.find({
      where: { operator_id: operatorId },
      select: ["price"],
    });

    const estimatedRevenue = propertiesWithPrice.reduce(
      (total, prop) => total + prop.price,
      0
    );

    return {
      properties: propertiesCount,
      tenants: uniqueTenantIds.size,
      total_interactions: totalInteractions,
      estimated_revenue: estimatedRevenue,
    };
  }
}
