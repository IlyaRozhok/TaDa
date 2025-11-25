import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { Building } from "../../entities/building.entity";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    @InjectRepository(Building)
    private buildingRepository: Repository<Building>
  ) {}

  async create(createPropertyDto: CreatePropertyDto): Promise<Property> {
    console.log('📥 Received DTO:', JSON.stringify(createPropertyDto, null, 2));
    
    // Verify that the building exists
    const building = await this.buildingRepository.findOne({
      where: { id: createPropertyDto.building_id },
      relations: ["operator"],
    });

    if (!building) {
      throw new NotFoundException("Building not found");
    }

    // Clean and prepare data
    const propertyData: any = {
      title: createPropertyDto.title,
      description: createPropertyDto.description,
      address: createPropertyDto.address,
      price: Number(createPropertyDto.price),
      bedrooms: Number(createPropertyDto.bedrooms),
      bathrooms: Number(createPropertyDto.bathrooms),
      furnishing: createPropertyDto.furnishing,
      available_from: new Date(createPropertyDto.available_from),
      apartment_number: createPropertyDto.apartment_number,
      building_id: createPropertyDto.building_id,
      operator_id: building.operator_id,
      photos: createPropertyDto.photos || [],
    };
    
    console.log('🔧 Prepared propertyData:', JSON.stringify(propertyData, null, 2));

    // Only add optional fields if they have valid values
    if (createPropertyDto.descriptions && createPropertyDto.descriptions.trim()) {
      propertyData.descriptions = createPropertyDto.descriptions;
    }

    if (createPropertyDto.price != null) {
      propertyData.price = Number(createPropertyDto.price);
    }

    if (createPropertyDto.deposit != null) {
      propertyData.deposit = Number(createPropertyDto.deposit);
    }

    if (createPropertyDto.available_from && createPropertyDto.available_from.trim()) {
      propertyData.available_from = new Date(createPropertyDto.available_from);
    }

    if (createPropertyDto.bills && createPropertyDto.bills.trim()) {
      propertyData.bills = createPropertyDto.bills;
    }

    if (createPropertyDto.property_type && createPropertyDto.property_type.trim()) {
      propertyData.property_type = createPropertyDto.property_type;
    }

    if (createPropertyDto.bedrooms != null) {
      propertyData.bedrooms = Number(createPropertyDto.bedrooms);
    }

    if (createPropertyDto.bathrooms != null) {
      propertyData.bathrooms = Number(createPropertyDto.bathrooms);
    }

    if (createPropertyDto.building_type && createPropertyDto.building_type.trim()) {
      propertyData.building_type = createPropertyDto.building_type;
    }

    if (createPropertyDto.furnishing && createPropertyDto.furnishing.trim()) {
      propertyData.furnishing = createPropertyDto.furnishing;
    }

    if (createPropertyDto.let_duration && createPropertyDto.let_duration.trim()) {
      propertyData.let_duration = createPropertyDto.let_duration;
    }

    if (createPropertyDto.floor != null) {
      propertyData.floor = Number(createPropertyDto.floor);
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

    if (createPropertyDto.square_meters != null) {
      propertyData.square_meters = Number(createPropertyDto.square_meters);
    }

    if (createPropertyDto.video && createPropertyDto.video.trim()) {
      propertyData.video = createPropertyDto.video;
    }

    if (createPropertyDto.documents && createPropertyDto.documents.trim()) {
      propertyData.documents = createPropertyDto.documents;
    }

    const property = this.propertyRepository.create(propertyData);
    const saved = await this.propertyRepository.save(property);
    const savedProperty = Array.isArray(saved) ? saved[0] : saved;

    // Reload with relations
    const reloadedProperty = await this.propertyRepository.findOne({
      where: { id: savedProperty.id },
      relations: ["building", "building.operator", "operator"],
    });

    if (!reloadedProperty) {
      throw new NotFoundException("Property not found after creation");
    }

    return reloadedProperty;
  }

  async findAll(params?: {
    building_id?: string;
    operator_id?: string;
  }): Promise<Property[]> {
    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.building", "building")
      .leftJoinAndSelect("property.operator", "operator")
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

    return await queryBuilder.getMany();
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
      .leftJoinAndSelect("building.operator", "operator")
      .orderBy("property.created_at", "DESC");

    // Add search functionality if search term is provided
    if (params?.search && params.search.trim()) {
      const search = `%${params.search.trim()}%`;
      queryBuilder.andWhere(
        "(property.apartment_number ILIKE :search OR " +
        "property.descriptions ILIKE :search OR " +
        "building.name ILIKE :search OR " +
        "building.address ILIKE :search)",
        { search }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
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
      relations: ["building", "building.operator", "operator"],
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    return property;
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto
  ): Promise<Property> {
    const property = await this.findOne(id);

    // Clean and prepare update data
    const updateData: any = {};

    // If building_id is being updated, verify the new building exists and update operator_id
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

      // Update operator_id from the new building
      updateData.building_id = updatePropertyDto.building_id;
      updateData.operator_id = building.operator_id;
    }

    // Only add fields that are actually being updated
    if (updatePropertyDto.apartment_number !== undefined) {
      updateData.apartment_number = updatePropertyDto.apartment_number;
    }

    if (updatePropertyDto.descriptions !== undefined) {
      updateData.descriptions = updatePropertyDto.descriptions && updatePropertyDto.descriptions.trim() 
        ? updatePropertyDto.descriptions 
        : null;
    }

    if (updatePropertyDto.price !== undefined) {
      updateData.price = updatePropertyDto.price != null
        ? Number(updatePropertyDto.price) 
        : null;
    }

    if (updatePropertyDto.deposit !== undefined) {
      updateData.deposit = updatePropertyDto.deposit != null
        ? Number(updatePropertyDto.deposit) 
        : null;
    }

    if (updatePropertyDto.available_from !== undefined) {
      updateData.available_from = updatePropertyDto.available_from && updatePropertyDto.available_from.trim() 
        ? new Date(updatePropertyDto.available_from) 
        : null;
    }

    if (updatePropertyDto.bills !== undefined) {
      updateData.bills = updatePropertyDto.bills && updatePropertyDto.bills.trim() 
        ? updatePropertyDto.bills 
        : null;
    }

    if (updatePropertyDto.property_type !== undefined) {
      updateData.property_type = updatePropertyDto.property_type && updatePropertyDto.property_type.trim() 
        ? updatePropertyDto.property_type 
        : null;
    }

    if (updatePropertyDto.bedrooms !== undefined) {
      updateData.bedrooms = updatePropertyDto.bedrooms != null
        ? Number(updatePropertyDto.bedrooms) 
        : null;
    }

    if (updatePropertyDto.bathrooms !== undefined) {
      updateData.bathrooms = updatePropertyDto.bathrooms != null
        ? Number(updatePropertyDto.bathrooms) 
        : null;
    }

    if (updatePropertyDto.building_type !== undefined) {
      updateData.building_type = updatePropertyDto.building_type && updatePropertyDto.building_type.trim() 
        ? updatePropertyDto.building_type 
        : null;
    }

    if (updatePropertyDto.furnishing !== undefined) {
      updateData.furnishing = updatePropertyDto.furnishing && updatePropertyDto.furnishing.trim() 
        ? updatePropertyDto.furnishing 
        : null;
    }

    if (updatePropertyDto.let_duration !== undefined) {
      updateData.let_duration = updatePropertyDto.let_duration && updatePropertyDto.let_duration.trim() 
        ? updatePropertyDto.let_duration 
        : null;
    }

    if (updatePropertyDto.floor !== undefined) {
      updateData.floor = updatePropertyDto.floor != null
        ? Number(updatePropertyDto.floor) 
        : null;
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

    if (updatePropertyDto.square_meters !== undefined) {
      updateData.square_meters = updatePropertyDto.square_meters != null
        ? Number(updatePropertyDto.square_meters) 
        : null;
    }

    if (updatePropertyDto.photos !== undefined) {
      updateData.photos = updatePropertyDto.photos || [];
    }

    if (updatePropertyDto.video !== undefined) {
      updateData.video = updatePropertyDto.video && updatePropertyDto.video.trim() 
        ? updatePropertyDto.video 
        : null;
    }

    if (updatePropertyDto.documents !== undefined) {
      updateData.documents = updatePropertyDto.documents && updatePropertyDto.documents.trim() 
        ? updatePropertyDto.documents 
        : null;
    }

    // Use QueryBuilder for direct update
    if (Object.keys(updateData).length > 0) {
      await this.propertyRepository
        .createQueryBuilder()
        .update(Property)
        .set(updateData)
        .where("id = :id", { id: property.id })
        .execute();
    }

    // Reload with relations
    const reloadedProperty = await this.propertyRepository.findOne({
      where: { id: property.id },
      relations: ["building", "building.operator", "operator"],
    });

    if (!reloadedProperty) {
      throw new NotFoundException("Property not found after update");
    }

    return reloadedProperty;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const property = await this.findOne(id);

    await this.propertyRepository.remove(property);

    return {
      success: true,
      message: "Property deleted successfully",
    };
  }
}

