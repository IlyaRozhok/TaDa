import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { Building } from "../../entities/building.entity";
import {
  assignPropertyOptionals,
  normalizeFindParams,
} from "./property.mapper";
import { PublicPropertyResponse, toPublicProperty } from "./property.response";

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>
  ) {}

  async create(createPropertyDto: CreatePropertyDto): Promise<Property> {
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
    }

    // Prepare data
    const propertyData: Partial<Property> = {
      title: createPropertyDto.title,
      photos: createPropertyDto.photos || [],
      luxury: createPropertyDto.luxury || false,
    };

    // Handle building vs private landlord logic
    if (createPropertyDto.building_type === "private_landlord") {
      // For private landlord, link directly to operator
      propertyData.building_id = null;
      propertyData.operator_id = createPropertyDto.operator_id;
      // Use provided values for inherited fields
      propertyData.address = createPropertyDto.address;
      propertyData.tenant_types = createPropertyDto.tenant_types || [];
      propertyData.amenities = createPropertyDto.amenities || [];
      propertyData.is_concierge = createPropertyDto.is_concierge;
      propertyData.pet_policy = createPropertyDto.pet_policy;
      propertyData.smoking_area = createPropertyDto.smoking_area;
      propertyData.metro_stations = createPropertyDto.metro_stations || [];
      propertyData.concierge_hours = createPropertyDto.concierge_hours || null;
      propertyData.pets = createPropertyDto.pets || null;
    } else {
      // Normal case - link to building and inherit fields
      propertyData.building_id = createPropertyDto.building_id;
      propertyData.operator_id = building.operator_id;
      // Inherit fields from building
      propertyData.address = building.address;
      propertyData.tenant_types = building.tenant_type || [];
      propertyData.amenities = building.amenities || [];
      propertyData.is_concierge = building.is_concierge;
      propertyData.pet_policy = building.pet_policy;
      propertyData.smoking_area = building.smoking_area;
      propertyData.metro_stations = building.metro_stations || [];
      propertyData.concierge_hours = building.concierge_hours || null;
      propertyData.pets = building.pets || null;
    }

    assignPropertyOptionals(propertyData, createPropertyDto);

    const property = this.propertyRepository.create(propertyData);
    const saved = await this.propertyRepository.save(property);
    const savedProperty = Array.isArray(saved) ? saved[0] : saved;
    return this.findOne(savedProperty.id);
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto
  ): Promise<Property> {
    const property = await this.findOne(id);
    const updateData: Partial<Property> = {};

    // Handle building type changes
    if (
      updatePropertyDto.building_type !== undefined &&
      updatePropertyDto.building_type !== property.building_type
    ) {
      if (updatePropertyDto.building_type === "private_landlord") {
        // Unlink from building and link directly to operator
        updateData.building_id = null;
        if (updatePropertyDto.operator_id) {
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

          updateData.building_id = updatePropertyDto.building_id;
          updateData.operator_id = building.operator_id;
          // Re-inherit fields from building
          updateData.address = building.address;
          updateData.tenant_types = building.tenant_type || [];
          updateData.amenities = building.amenities || [];
          updateData.is_concierge = building.is_concierge;
          updateData.pet_policy = building.pet_policy;
          updateData.smoking_area = building.smoking_area;
          updateData.metro_stations = building.metro_stations || [];
          updateData.concierge_hours = building.concierge_hours || null;
          updateData.pets = building.pets || null;
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

      updateData.building_id = updatePropertyDto.building_id;
      updateData.operator_id = building.operator_id;

      // Re-inherit fields from new building
      updateData.address = building.address;
      updateData.tenant_types = building.tenant_type || [];
      updateData.amenities = building.amenities || [];
      updateData.is_concierge = building.is_concierge;
      updateData.pet_policy = building.pet_policy;
      updateData.smoking_area = building.smoking_area;
      updateData.metro_stations = building.metro_stations || [];
      updateData.concierge_hours = building.concierge_hours || null;
      updateData.pets = building.pets || null;
    }

    assignPropertyOptionals(updateData, updatePropertyDto);

    await this.propertyRepository.update(id, updateData);
    return this.findOne(id);
  }

  async findAllPublic(
    params?: Partial<{ page: number; limit: number; search: string }>
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
      .orderBy("property.created_at", "DESC");

    if (search) {
      const like = `%${search}%`;
      queryBuilder.andWhere(
        "(property.apartment_number ILIKE :search OR property.title ILIKE :search OR building.name ILIKE :search)",
        { search: like }
      );
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const properties = await queryBuilder.getMany();

    return {
      data: properties.map(toPublicProperty),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
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

  async findAll(params?: {
    building_id?: string;
    operator_id?: string;
  }): Promise<Property[]> {
    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.building", "building")
      .leftJoinAndSelect("building.operator", "operator")
      .orderBy("property.created_at", "DESC");

    if (params?.building_id) {
      queryBuilder.andWhere("property.building_id = :building_id", {
        building_id: params.building_id,
      });
    }

    if (params?.operator_id) {
      queryBuilder.andWhere("property.operator_id = :operator_id", {
        operator_id: params.operator_id,
      });
    }

    return queryBuilder.getMany();
  }

  async remove(id: string): Promise<void> {
    const property = await this.findOne(id);
    await this.propertyRepository.remove(property);
  }
}
