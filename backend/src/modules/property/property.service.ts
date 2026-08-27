import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "@/entities/user.entity";
import { Property } from "../../entities/property.entity";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { Building } from "../../entities/building.entity";
import { FindAdminPropertiesDto } from "./dto/find-admin-properties.dto";
import {
  AdminFindParams,
  assignPropertyOptionals,
  normalizeAdminFindParams,
  normalizeFindParams,
} from "./property.mapper";
import { PublicPropertyResponse, toPublicProperty } from "./property.response";
import { S3Service } from "../../common/services/s3.service";

/** How many flagged properties the landing section shows at most. */
export const LANDING_LISTINGS_LIMIT = 6;

/**
 * Envelope of the admin properties list. Same shape as the public list's,
 * plus the page size the server actually applied — the admin table renders a
 * numbered control off it and cannot assume its own default was honoured.
 */
export interface AdminPropertiesPage {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    createPropertyDto: CreatePropertyDto,
    userId: string,
    userRole: string,
  ): Promise<Property> {
    let building: Building | null = null;

    // For private landlord, building is not required
    if (createPropertyDto.building_id) {
      building = await this.buildingRepository.findOne({
        where: { id: createPropertyDto.building_id },
        relations: ["operator"],
      });

      if (!building) {
        throw new NotFoundException("Building not found");
      }

      // Non-admins may only attach properties to buildings they own
      if (userRole !== UserRole.Admin && building.operator_id !== userId) {
        throw new ForbiddenException(
          "You can only create properties in your own buildings",
        );
      }
    }

    // Prepare data
    const propertyData: Partial<Property> = {
      title: createPropertyDto.title,
      photos: createPropertyDto.photos || [],
    };

    // Handle building vs private landlord logic
    if (createPropertyDto.building_type === "private_landlord") {
      // For private landlord, link directly to operator.
      // Only admins may assign the property to another operator.
      propertyData.building_id = undefined;
      propertyData.operator_id =
        userRole === UserRole.Admin && createPropertyDto.operator_id
          ? createPropertyDto.operator_id
          : userId;
      // Use provided values for inherited fields
      propertyData.address = createPropertyDto.address;
      propertyData.tenant_types = createPropertyDto.tenant_types || [];
      propertyData.amenities = createPropertyDto.amenities || [];
      propertyData.family_status = createPropertyDto.family_status || [];
      propertyData.occupation = createPropertyDto.occupation || [];
      propertyData.children = createPropertyDto.children || [];
      propertyData.pet_policy = createPropertyDto.pet_policy;
      propertyData.metro_stations = createPropertyDto.metro_stations || [];
      propertyData.pets = createPropertyDto.pets || undefined;
    } else if (building) {
      // Normal case - link to building and inherit fields
      propertyData.building_id = createPropertyDto.building_id;
      propertyData.operator_id = building.operator_id ?? undefined;
      // Inherit fields from building
      propertyData.address = building.address ?? undefined;
      propertyData.tenant_types = building.tenant_type || [];
      propertyData.amenities = building.amenities || [];
      propertyData.family_status = building.family_status || [];
      propertyData.occupation = building.occupation || [];
      propertyData.children = building.children || [];
      propertyData.pet_policy = building.pet_policy;
      propertyData.metro_stations = building.metro_stations || [];
      propertyData.pets = building.pets || null;
    } else {
      // No building provided - use authenticated user as operator
      propertyData.building_id = undefined;
      propertyData.operator_id = userId;
      // Use provided values for fields
      propertyData.address = createPropertyDto.address;
      propertyData.tenant_types = createPropertyDto.tenant_types || [];
      propertyData.amenities = createPropertyDto.amenities || [];
      propertyData.family_status = createPropertyDto.family_status || [];
      propertyData.occupation = createPropertyDto.occupation || [];
      propertyData.children = createPropertyDto.children || [];
      propertyData.pet_policy = createPropertyDto.pet_policy;
      propertyData.metro_stations = createPropertyDto.metro_stations || [];
      propertyData.pets = createPropertyDto.pets || undefined;
    }

    assignPropertyOptionals(
      propertyData,
      this.stripAdminOnlyFields(createPropertyDto, userRole),
    );

    const property = this.propertyRepository.create(propertyData);
    const saved = await this.propertyRepository.save(property);
    const savedProperty = Array.isArray(saved) ? saved[0] : saved;
    return this.findOne(savedProperty.id);
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    userId: string,
    userRole: string,
  ): Promise<Property> {
    const property = await this.findOne(id);
    this.ensureOwnerOrAdmin(property.operator_id, userId, userRole);
    const updateData: Partial<Property> = {};

    // Handle building type changes
    if (
      updatePropertyDto.building_type !== undefined &&
      updatePropertyDto.building_type !== property.building_type
    ) {
      if (updatePropertyDto.building_type === "private_landlord") {
        // Unlink from building and link directly to operator.
        // Only admins may reassign the property to another operator.
        // MUST be null, not undefined: TypeORM's update() skips undefined
        // values entirely, so undefined left the old building linked.
        updateData.building_id = null;
        if (updatePropertyDto.operator_id && userRole === UserRole.Admin) {
          updateData.operator_id = updatePropertyDto.operator_id;
        }
        // The inherited fields will be updated below
      } else {
        // Link back to building if changed from private_landlord
        if (updatePropertyDto.building_id) {
          const building = await this.buildingRepository.findOne({
            where: { id: updatePropertyDto.building_id },
            relations: ["operator"],
          });

          if (!building) {
            throw new NotFoundException("Building not found");
          }

          // Non-admins may only link properties to buildings they own
          if (userRole !== UserRole.Admin && building.operator_id !== userId) {
            throw new ForbiddenException(
              "You can only link properties to your own buildings",
            );
          }

          updateData.building_id = updatePropertyDto.building_id;
          updateData.operator_id = building.operator_id ?? undefined;
          // Re-inherit fields from building
          updateData.address = building.address ?? undefined;
          updateData.tenant_types = building.tenant_type || [];
          updateData.amenities = building.amenities || [];
          updateData.family_status = building.family_status || [];
          updateData.occupation = building.occupation || [];
          updateData.children = building.children || [];
          updateData.pet_policy = building.pet_policy;
          updateData.metro_stations = building.metro_stations || [];
          updateData.pets = building.pets || undefined;
        }
      }
    }
    // Update building if changed (normal case)
    else if (
      updatePropertyDto.building_id &&
      updatePropertyDto.building_id !== property.building_id
    ) {
      const building = await this.buildingRepository.findOne({
        where: { id: updatePropertyDto.building_id },
        relations: ["operator"],
      });

      if (!building) {
        throw new NotFoundException("Building not found");
      }

      // Non-admins may only link properties to buildings they own
      if (userRole !== UserRole.Admin && building.operator_id !== userId) {
        throw new ForbiddenException(
          "You can only link properties to your own buildings",
        );
      }

      updateData.building_id = updatePropertyDto.building_id;
      updateData.operator_id = building.operator_id ?? undefined;

      // Re-inherit fields from new building
      updateData.address = building.address ?? undefined;
      updateData.tenant_types = building.tenant_type || [];
      updateData.amenities = building.amenities || [];
      updateData.family_status = building.family_status || [];
      updateData.occupation = building.occupation || [];
      updateData.children = building.children || [];
      updateData.pet_policy = building.pet_policy;
      updateData.metro_stations = building.metro_stations || [];
      updateData.pets = building.pets || null;
    }

    assignPropertyOptionals(
      updateData,
      this.stripAdminOnlyFields(updatePropertyDto, userRole),
    );

    await this.propertyRepository.update(id, updateData);
    return this.findOne(id);
  }

  async findAllPublic(
    params?: Partial<{
      page: number;
      limit: number;
      search: string;
      building_id?: string;
    }>,
  ): Promise<{
    data: PublicPropertyResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page, limit, search } = normalizeFindParams({
      page: params?.page?.toString(),
      limit: params?.limit?.toString(),
      search: params?.search,
    });
    const skip = (page - 1) * limit;

    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.building", "building")
      .addSelect("property.price")
      .addSelect("property.deposit")
      .addSelect("property.bedrooms")
      .addSelect("property.bathrooms")
      .addSelect("property.square_meters")
      .orderBy("property.created_at", "DESC");

    if (params?.building_id) {
      queryBuilder.andWhere("property.building_id = :building_id", {
        building_id: params.building_id,
      });
    }

    if (search) {
      const like = `%${search}%`;
      queryBuilder.andWhere(
        "(property.apartment_number ILIKE :search OR property.title ILIKE :search OR building.name ILIKE :search OR property.id::text ILIKE :search)",
        { search: like },
      );
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const properties = await queryBuilder.getMany();

    // Update photo URLs for all properties
    const propertiesWithFreshUrls = await Promise.all(
      properties.map((property) => this.updatePhotosUrls(property)),
    );

    return {
      data: propertiesWithFreshUrls.map(toPublicProperty),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * The landing pages' listings section: the newest flagged properties, a bare
   * array, no auth. One set serves both landings — audience and manual order
   * are deliberately not modelled, so "newest first, capped at six" is the
   * whole ordering story.
   */
  async findLandingListings(): Promise<PublicPropertyResponse[]> {
    const properties = await this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.building", "building")
      .where("property.is_landing_listing = :flagged", { flagged: true })
      .orderBy("property.created_at", "DESC")
      .take(LANDING_LISTINGS_LIMIT)
      .getMany();

    const propertiesWithFreshUrls = await Promise.all(
      properties.map((property) => this.updatePhotosUrls(property)),
    );

    return propertiesWithFreshUrls.map(toPublicProperty);
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ["building", "operator"],
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    return property;
  }

  async findOnePublic(id: string): Promise<PublicPropertyResponse> {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ["building", "operator"],
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    // Update photo URLs before returning
    const propertyWithFreshUrls = await this.updatePhotosUrls(property);
    return toPublicProperty(propertyWithFreshUrls);
  }

  /**
   * The admin list, one page at a time. Search and every filter are applied in
   * SQL so the table never has to hold the whole catalogue to narrow it.
   * Returns the page and the count of everything that matched.
   */
  async findAll(params: AdminFindParams): Promise<[Property[], number]> {
    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.building", "building")
      .leftJoinAndSelect("building.operator", "operator")
      .orderBy("property.created_at", "DESC")
      .skip((params.page - 1) * params.limit)
      .take(params.limit);

    if (params.building_id) {
      queryBuilder.andWhere("property.building_id = :building_id", {
        building_id: params.building_id,
      });
    }

    if (params.operator_id) {
      queryBuilder.andWhere("property.operator_id = :operator_id", {
        operator_id: params.operator_id,
      });
    }

    if (params.is_landing_listing !== undefined) {
      queryBuilder.andWhere("property.is_landing_listing = :flagged", {
        flagged: params.is_landing_listing,
      });
    }

    if (params.property_type) {
      queryBuilder.andWhere("property.property_type = :property_type", {
        property_type: params.property_type,
      });
    }

    // Exact count for the closed buckets, lower bound for the open-ended one.
    if (params.bedrooms !== undefined) {
      queryBuilder.andWhere("property.bedrooms = :bedrooms", {
        bedrooms: params.bedrooms,
      });
    }
    if (params.bedrooms_min !== undefined) {
      queryBuilder.andWhere("property.bedrooms >= :bedrooms_min", {
        bedrooms_min: params.bedrooms_min,
      });
    }
    if (params.bathrooms !== undefined) {
      queryBuilder.andWhere("property.bathrooms = :bathrooms", {
        bathrooms: params.bathrooms,
      });
    }
    if (params.bathrooms_min !== undefined) {
      queryBuilder.andWhere("property.bathrooms >= :bathrooms_min", {
        bathrooms_min: params.bathrooms_min,
      });
    }

    if (params.search) {
      queryBuilder.andWhere(
        "(property.title ILIKE :search OR property.descriptions ILIKE :search)",
        { search: `%${params.search}%` },
      );
    }

    return queryBuilder.getManyAndCount();
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const property = await this.findOne(id);
    this.ensureOwnerOrAdmin(property.operator_id, userId, userRole);
    await this.propertyRepository.remove(property);
  }

  /**
   * `is_landing_listing` decides what a signed-out visitor sees on the
   * marketing landings, so only an admin may set it. For every other role the
   * field is dropped from the payload rather than rejected: an operator whose
   * client echoes a whole property back on save must not start getting 400s
   * for a flag they never touched.
   */
  private stripAdminOnlyFields<T extends CreatePropertyDto | UpdatePropertyDto>(
    dto: T,
    userRole: string,
  ): T {
    if (userRole === UserRole.Admin || dto.is_landing_listing === undefined) {
      return dto;
    }

    const { is_landing_listing: _adminOnly, ...rest } = dto;
    return rest as T;
  }

  private ensureOwnerOrAdmin(
    operatorId: string | null | undefined,
    userId: string,
    userRole: string,
  ): void {
    if (userRole === UserRole.Admin) return;
    if (!operatorId || operatorId !== userId) {
      throw new ForbiddenException("You can only manage your own properties");
    }
  }

  private async updatePhotosUrls(property: Property): Promise<Property> {
    await this.s3Service.refreshMediaUrls(property, {
      singleFields: ["video", "documents"],
      arrayFields: ["photos"],
    });
    if (property.building?.logo) {
      property.building.logo = await this.s3Service.refreshUrl(
        property.building.logo,
      );
    }
    return property;
  }

  /**
   * Find property by ID with updated photo URLs.
   * Operators can only read their own properties; admins can read any.
   */
  async findOneWithFreshUrls(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<Property> {
    const property = await this.findOne(id);
    this.ensureOwnerOrAdmin(property.operator_id, userId, userRole);
    return await this.updatePhotosUrls(property);
  }

  /**
   * One page of the admin list, with fresh photo URLs. Only the page's rows
   * get their S3 URLs re-signed, not the whole catalogue.
   */
  async findAllWithFreshUrls(
    query?: FindAdminPropertiesDto,
  ): Promise<AdminPropertiesPage> {
    const params = normalizeAdminFindParams(query);
    const [properties, total] = await this.findAll(params);

    const data = await Promise.all(
      properties.map((property) => this.updatePhotosUrls(property)),
    );

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
