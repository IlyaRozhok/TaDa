import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Building } from "../../entities/building.entity";
import { Property } from "../../entities/property.entity";
import { User, UserRole } from "../../entities/user.entity";
import { CreateBuildingDto } from "./dto/create-building.dto";
import { UpdateBuildingDto } from "./dto/update-building.dto";
import { BuildingResponse, toBuildingResponse } from "./building.mapper";

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(Building)
    private buildingRepository: Repository<Building>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(
    createBuildingDto: CreateBuildingDto
  ): Promise<BuildingResponse> {
    // Verify that the operator exists and has operator role
    const operator = await this.userRepository.findOne({
      where: { id: createBuildingDto.operator_id },
      relations: ["operatorProfile"],
    });

    if (!operator) {
      throw new NotFoundException("Operator not found");
    }

    this.ensureOperatorRole(operator);

    // Set default values for optional fields
    const buildingData = {
      // Required fields
      name: createBuildingDto.name,
      operator_id: createBuildingDto.operator_id,

      // Optional fields with defaults
      address: createBuildingDto.address || null,
      number_of_units: createBuildingDto.number_of_units ?? null,
      type_of_unit: createBuildingDto.type_of_unit || [],
      logo: createBuildingDto.logo || null,
      video: createBuildingDto.video || null,
      photos: createBuildingDto.photos || [],
      documents: createBuildingDto.documents || null,
      metro_stations: createBuildingDto.metro_stations || [],
      areas: createBuildingDto.areas || [],
      districts: createBuildingDto.districts || [],
      amenities: createBuildingDto.amenities || [],
      is_concierge: createBuildingDto.is_concierge ?? false,
      concierge_hours: createBuildingDto.concierge_hours || null,
      pet_policy: createBuildingDto.pet_policy ?? false,
      pets: createBuildingDto.pets || null,
      smoking_area: createBuildingDto.smoking_area ?? false,
      tenant_type: createBuildingDto.tenant_type || ["family"],
    };

    const building = this.buildingRepository.create(buildingData);
    const savedBuilding = await this.buildingRepository.save(building);

    // Reload the building with relations to ensure we return the correct operator
    const reloadedBuilding = await this.buildingRepository.findOne({
      where: { id: savedBuilding.id },
      relations: ["operator", "operator.operatorProfile", "properties"],
    });

    if (!reloadedBuilding) {
      throw new NotFoundException("Building not found after creation");
    }

    return toBuildingResponse(reloadedBuilding);
  }

  async findAll(): Promise<BuildingResponse[]> {
    const buildings = await this.buildingRepository.find({
      relations: ["operator", "operator.operatorProfile", "properties"],
      order: { created_at: "DESC" },
    });
    return buildings.map(toBuildingResponse);
  }

  async findByOperator(operatorId: string): Promise<BuildingResponse[]> {
    const buildings = await this.buildingRepository.find({
      where: { operator_id: operatorId },
      relations: ["operator", "operator.operatorProfile", "properties"],
      order: { created_at: "DESC" },
    });
    return buildings.map(toBuildingResponse);
  }

  async findOne(id: string): Promise<BuildingResponse> {
    const building = await this.buildingRepository.findOne({
      where: { id },
      relations: ["operator", "operator.operatorProfile", "properties"],
    });

    if (!building) {
      throw new NotFoundException("Building not found");
    }

    return toBuildingResponse(building);
  }

  async update(
    id: string,
    updateBuildingDto: UpdateBuildingDto
  ): Promise<BuildingResponse> {
    const building = await this.findOne(id);

    // If operator_id is being updated, verify the new operator exists and has operator role
    // Handle both null and empty string as null
    let operatorId: string | null | undefined = undefined;

    if (updateBuildingDto.operator_id !== undefined) {
      operatorId =
        updateBuildingDto.operator_id === "" ||
        updateBuildingDto.operator_id === null
          ? null
          : updateBuildingDto.operator_id;

      if (operatorId) {
        const operator = await this.userRepository.findOne({
          where: { id: operatorId },
          relations: ["operatorProfile"],
        });

        if (!operator) {
          throw new NotFoundException("Operator not found");
        }

        this.ensureOperatorRole(operator);
      }
    }

    const updateData: Partial<Building> = {};

    if (updateBuildingDto.name !== undefined)
      updateData.name = updateBuildingDto.name;
    if (updateBuildingDto.address !== undefined)
      updateData.address = updateBuildingDto.address;
    if (updateBuildingDto.number_of_units !== undefined)
      updateData.number_of_units = updateBuildingDto.number_of_units;
    if (updateBuildingDto.type_of_unit !== undefined)
      updateData.type_of_unit = updateBuildingDto.type_of_unit;
    if (updateBuildingDto.logo !== undefined)
      updateData.logo = updateBuildingDto.logo;
    if (updateBuildingDto.video !== undefined)
      updateData.video = updateBuildingDto.video;
    if (updateBuildingDto.photos !== undefined)
      updateData.photos = updateBuildingDto.photos;
    if (updateBuildingDto.documents !== undefined)
      updateData.documents = updateBuildingDto.documents;
    if (updateBuildingDto.metro_stations !== undefined)
      updateData.metro_stations = updateBuildingDto.metro_stations;
    if (updateBuildingDto.areas !== undefined)
      updateData.areas = updateBuildingDto.areas;
    if (updateBuildingDto.districts !== undefined)
      updateData.districts = updateBuildingDto.districts;
    if (updateBuildingDto.amenities !== undefined)
      updateData.amenities = updateBuildingDto.amenities;
    if (updateBuildingDto.is_concierge !== undefined)
      updateData.is_concierge = updateBuildingDto.is_concierge;
    if (updateBuildingDto.concierge_hours !== undefined)
      updateData.concierge_hours = updateBuildingDto.concierge_hours;
    if (updateBuildingDto.pet_policy !== undefined)
      updateData.pet_policy = updateBuildingDto.pet_policy;
    if (updateBuildingDto.pets !== undefined)
      updateData.pets = updateBuildingDto.pets;
    if (updateBuildingDto.smoking_area !== undefined)
      updateData.smoking_area = updateBuildingDto.smoking_area;
    if (updateBuildingDto.tenant_type !== undefined)
      updateData.tenant_type = updateBuildingDto.tenant_type;

    if (operatorId !== undefined) {
      updateData.operator_id = operatorId;
    }

    const updateQueryBuilder = this.buildingRepository
      .createQueryBuilder()
      .update(Building)
      .set(updateData)
      .where("id = :id", { id: building.id });

    await updateQueryBuilder.execute();

    if (operatorId !== undefined) {
      await this.propertyRepository
        .createQueryBuilder()
        .update(Property)
        .set({ operator_id: operatorId })
        .where("building_id = :buildingId", { buildingId: building.id })
        .execute();
    }

    const inheritedFieldsUpdates: Partial<Property> = {};

    if (updateBuildingDto.address !== undefined)
      inheritedFieldsUpdates.address = updateBuildingDto.address;
    if (updateBuildingDto.tenant_type !== undefined)
      inheritedFieldsUpdates.tenant_types = updateBuildingDto.tenant_type;
    if (updateBuildingDto.amenities !== undefined)
      inheritedFieldsUpdates.amenities = updateBuildingDto.amenities;
    if (updateBuildingDto.is_concierge !== undefined)
      inheritedFieldsUpdates.is_concierge = updateBuildingDto.is_concierge;
    if (updateBuildingDto.pet_policy !== undefined)
      inheritedFieldsUpdates.pet_policy = updateBuildingDto.pet_policy;
    if (updateBuildingDto.smoking_area !== undefined)
      inheritedFieldsUpdates.smoking_area = updateBuildingDto.smoking_area;

    if (Object.keys(inheritedFieldsUpdates).length > 0) {
      await this.propertyRepository
        .createQueryBuilder()
        .update(Property)
        .set(inheritedFieldsUpdates)
        .where("building_id = :buildingId", { buildingId: building.id })
        .execute();
    }

    const reloadedBuilding = await this.buildingRepository.findOne({
      where: { id: building.id },
      relations: ["operator", "operator.operatorProfile", "properties"],
    });

    if (!reloadedBuilding) {
      throw new NotFoundException("Building not found after update");
    }

    return toBuildingResponse(reloadedBuilding);
  }

  async remove(
    id: string
  ): Promise<{ success: boolean; message: string; id: string }> {
    const building = await this.buildingRepository.findOne({
      where: { id },
      relations: ["properties"],
    });

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }

    if (building.properties && building.properties.length > 0) {
      throw new BadRequestException(
        `Cannot delete building. It has ${building.properties.length} associated properties. Please delete or reassign the properties first.`
      );
    }

    const deleteResult = await this.buildingRepository.delete(id);

    if (!deleteResult || deleteResult.affected === 0) {
      throw new NotFoundException(
        `Building with ID ${id} could not be deleted. No rows affected.`
      );
    }

    const verifyDeleted = await this.buildingRepository.findOne({
      where: { id },
    });

    if (verifyDeleted) {
      throw new Error(`Building ${id} still exists after deletion attempt`);
    }

    return {
      success: true,
      message: "Building deleted successfully",
      id: id,
    };
  }

  async getOperators(): Promise<User[]> {
    return await this.userRepository.find({
      where: { role: UserRole.Operator },
      relations: ["operatorProfile"],
      order: { created_at: "DESC" },
    });
  }

  private ensureOperatorRole(user: User) {
    if (user.role === UserRole.Operator || user.role === UserRole.Admin) return;
    throw new BadRequestException(
      "User must have operator or admin role to manage buildings"
    );
  }
}
