import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { Building } from "../../entities/building.entity";

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>
  ) {}

  async create(createPropertyDto: CreatePropertyDto): Promise<Property> {
    let building: any = null;

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
    const propertyData: any = {
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

    // Add optional fields if provided
    if (createPropertyDto.apartment_number !== undefined) {
      propertyData.apartment_number = createPropertyDto.apartment_number;
    }

    if (createPropertyDto.descriptions !== undefined) {
      propertyData.descriptions = createPropertyDto.descriptions;
    }

    if (createPropertyDto.property_type !== undefined) {
      propertyData.property_type = createPropertyDto.property_type;
    }

    if (createPropertyDto.furnishing !== undefined) {
      propertyData.furnishing = createPropertyDto.furnishing;
    }

    if (createPropertyDto.bills !== undefined) {
      propertyData.bills = createPropertyDto.bills;
    }

    if (createPropertyDto.available_from !== undefined) {
      propertyData.available_from = createPropertyDto.available_from
        ? new Date(createPropertyDto.available_from)
        : null;
    }

    if (createPropertyDto.building_type !== undefined) {
      propertyData.building_type = createPropertyDto.building_type;
    }

    if (createPropertyDto.let_duration !== undefined) {
      propertyData.let_duration = createPropertyDto.let_duration;
    }

    if (createPropertyDto.floor != null) {
      propertyData.floor = createPropertyDto.floor;
    }

    if (createPropertyDto.square_meters != null) {
      propertyData.square_meters = createPropertyDto.square_meters;
    }

    if (createPropertyDto.outdoor_space != null) {
      propertyData.outdoor_space = createPropertyDto.outdoor_space;
    }

    if (createPropertyDto.balcony != null) {
      propertyData.balcony = createPropertyDto.balcony;
    }

    if (createPropertyDto.terrace != null) {
      propertyData.terrace = createPropertyDto.terrace;
    }

    if (createPropertyDto.price != null) {
      propertyData.price = createPropertyDto.price;
    }

    if (createPropertyDto.deposit != null) {
      propertyData.deposit = createPropertyDto.deposit;
    }

    if (createPropertyDto.bedrooms != null) {
      propertyData.bedrooms = createPropertyDto.bedrooms;
    }

    if (createPropertyDto.bathrooms != null) {
      propertyData.bathrooms = createPropertyDto.bathrooms;
    }

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
    const updateData: any = {};

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

    // Update fields
    if (updatePropertyDto.apartment_number !== undefined) {
      updateData.apartment_number = updatePropertyDto.apartment_number;
    }

    if (updatePropertyDto.title !== undefined) {
      updateData.title = updatePropertyDto.title;
    }

    if (updatePropertyDto.descriptions !== undefined) {
      updateData.descriptions = updatePropertyDto.descriptions;
    }

    if (updatePropertyDto.property_type !== undefined) {
      updateData.property_type = updatePropertyDto.property_type;
    }

    if (updatePropertyDto.furnishing !== undefined) {
      updateData.furnishing = updatePropertyDto.furnishing;
    }

    if (updatePropertyDto.bills !== undefined) {
      updateData.bills = updatePropertyDto.bills;
    }

    if (updatePropertyDto.available_from !== undefined) {
      updateData.available_from = updatePropertyDto.available_from
        ? new Date(updatePropertyDto.available_from)
        : null;
    }

    if (updatePropertyDto.building_type !== undefined) {
      updateData.building_type = updatePropertyDto.building_type;
    }

    if (updatePropertyDto.luxury !== undefined) {
      updateData.luxury = updatePropertyDto.luxury;
    }

    // Inherited fields
    if (updatePropertyDto.address !== undefined) {
      updateData.address = updatePropertyDto.address;
    }

    if (updatePropertyDto.tenant_types !== undefined) {
      updateData.tenant_types = updatePropertyDto.tenant_types;
    }

    if (updatePropertyDto.amenities !== undefined) {
      updateData.amenities = updatePropertyDto.amenities;
    }

    if (updatePropertyDto.is_concierge !== undefined) {
      updateData.is_concierge = updatePropertyDto.is_concierge;
    }

    if (updatePropertyDto.pet_policy !== undefined) {
      updateData.pet_policy = updatePropertyDto.pet_policy;
    }

    if (updatePropertyDto.smoking_area !== undefined) {
      updateData.smoking_area = updatePropertyDto.smoking_area;
    }

    if (updatePropertyDto.metro_stations !== undefined) {
      updateData.metro_stations = updatePropertyDto.metro_stations;
    }

    if (updatePropertyDto.commute_times !== undefined) {
      updateData.commute_times = updatePropertyDto.commute_times;
    }

    if (updatePropertyDto.local_essentials !== undefined) {
      updateData.local_essentials = updatePropertyDto.local_essentials;
    }

    if (updatePropertyDto.concierge_hours !== undefined) {
      updateData.concierge_hours = updatePropertyDto.concierge_hours;
    }

    if (updatePropertyDto.pets !== undefined) {
      updateData.pets = updatePropertyDto.pets;
    }

    if (updatePropertyDto.let_duration !== undefined) {
      updateData.let_duration = updatePropertyDto.let_duration;
    }

    if (updatePropertyDto.floor !== undefined) {
      updateData.floor = updatePropertyDto.floor;
    }

    if (updatePropertyDto.square_meters !== undefined) {
      updateData.square_meters = updatePropertyDto.square_meters;
    }

    if (updatePropertyDto.outdoor_space !== undefined) {
      updateData.outdoor_space = updatePropertyDto.outdoor_space;
    }

    if (updatePropertyDto.balcony !== undefined) {
      updateData.balcony = updatePropertyDto.balcony;
    }

    if (updatePropertyDto.terrace !== undefined) {
      updateData.terrace = updatePropertyDto.terrace;
    }

    if (updatePropertyDto.price !== undefined) {
      updateData.price = updatePropertyDto.price;
    }

    if (updatePropertyDto.deposit !== undefined) {
      updateData.deposit = updatePropertyDto.deposit;
    }

    if (updatePropertyDto.bedrooms !== undefined) {
      updateData.bedrooms = updatePropertyDto.bedrooms;
    }

    if (updatePropertyDto.bathrooms !== undefined) {
      updateData.bathrooms = updatePropertyDto.bathrooms;
    }

    if (updatePropertyDto.photos !== undefined) {
      updateData.photos = updatePropertyDto.photos;
    }

    await this.propertyRepository.update(id, updateData);
    return this.findOne(id);
  }

  async findAllPublic(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: Property[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const skip = (page - 1) * limit;

    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.building", "building")
      .orderBy("property.created_at", "DESC");

    if (params?.search && params.search.trim()) {
      const search = `%${params.search.trim()}%`;
      queryBuilder.andWhere(
        "(property.apartment_number ILIKE :search OR property.title ILIKE :search OR building.name ILIKE :search)",
        { search }
      );
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const properties = await queryBuilder.getMany();

    return {
      data: properties,
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
