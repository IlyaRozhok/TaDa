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
    // Verify that the building exists
    const building = await this.buildingRepository.findOne({
      where: { id: createPropertyDto.building_id },
      relations: ["operator"],
    });

    if (!building) {
      throw new NotFoundException("Building not found");
    }

    // Prepare data
    const propertyData: any = {
      building_id: createPropertyDto.building_id,
      operator_id: building.operator_id,
      title: createPropertyDto.title,
      photos: createPropertyDto.photos || [],
      luxury: createPropertyDto.luxury || false,
    };

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
      propertyData.available_from = createPropertyDto.available_from ? new Date(createPropertyDto.available_from) : null;
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

    // Update building if changed
    if (
      updatePropertyDto.building_id &&
      updatePropertyDto.building_id !== property.building_id
    ) {
      const building = await this.buildingRepository.findOne({
        where: { id: updatePropertyDto.building_id },
      });

      if (!building) {
        throw new NotFoundException("Building not found");
      }

      updateData.building_id = updatePropertyDto.building_id;
      updateData.operator_id = building.operator_id;
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
      updateData.available_from = updatePropertyDto.available_from ? new Date(updatePropertyDto.available_from) : null;
    }

    if (updatePropertyDto.building_type !== undefined) {
      updateData.building_type = updatePropertyDto.building_type;
    }

    if (updatePropertyDto.luxury !== undefined) {
      updateData.luxury = updatePropertyDto.luxury;
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
