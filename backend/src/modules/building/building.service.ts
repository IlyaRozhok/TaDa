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

  async create(createBuildingDto: CreateBuildingDto): Promise<Building> {
    // Verify that the operator exists and has operator role
    const operator = await this.userRepository.findOne({
      where: { id: createBuildingDto.operator_id },
      relations: ["operatorProfile"],
    });

    if (!operator) {
      throw new NotFoundException("Operator not found");
    }

    if (operator.role !== UserRole.Operator && operator.role !== UserRole.Admin) {
      throw new BadRequestException(
        "User must have operator or admin role to manage buildings"
      );
    }

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
      commute_times: createBuildingDto.commute_times || [],
      local_essentials: createBuildingDto.local_essentials || [],
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
    
    return reloadedBuilding;
  }

  async findAll(): Promise<Building[]> {
    return await this.buildingRepository.find({
      relations: ["operator", "operator.operatorProfile", "properties"],
      order: { created_at: "DESC" },
    });
  }

  async findByOperator(operatorId: string): Promise<Building[]> {
    return await this.buildingRepository.find({
      where: { operator_id: operatorId },
      relations: ["operator", "operator.operatorProfile", "properties"],
      order: { created_at: "DESC" },
    });
  }

  async findOne(id: string): Promise<Building> {
    const building = await this.buildingRepository.findOne({
      where: { id },
      relations: ["operator", "operator.operatorProfile", "properties"],
    });

    if (!building) {
      throw new NotFoundException("Building not found");
    }

    return building;
  }

  async update(
    id: string,
    updateBuildingDto: UpdateBuildingDto
  ): Promise<Building> {
    const building = await this.findOne(id);

    // If operator_id is being updated, verify the new operator exists and has operator role
    // Handle both null and empty string as null
    let operatorId: string | null | undefined = undefined;
    
    if (updateBuildingDto.operator_id !== undefined) {
      operatorId = updateBuildingDto.operator_id === "" || updateBuildingDto.operator_id === null 
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

        if (operator.role !== UserRole.Operator && operator.role !== UserRole.Admin) {
          throw new BadRequestException(
            "User must have operator or admin role to manage buildings"
          );
        }
      }
    }
    
    // Prepare update data - only include fields that are actually provided (not undefined)
    const updateData: Partial<Building> = {};

    // Handle each field individually to avoid overwriting with undefined
    if (updateBuildingDto.name !== undefined) updateData.name = updateBuildingDto.name;
    if (updateBuildingDto.address !== undefined) updateData.address = updateBuildingDto.address;
    if (updateBuildingDto.number_of_units !== undefined) updateData.number_of_units = updateBuildingDto.number_of_units;
    if (updateBuildingDto.type_of_unit !== undefined) updateData.type_of_unit = updateBuildingDto.type_of_unit;
    if (updateBuildingDto.logo !== undefined) updateData.logo = updateBuildingDto.logo;
    if (updateBuildingDto.video !== undefined) updateData.video = updateBuildingDto.video;
    if (updateBuildingDto.photos !== undefined) updateData.photos = updateBuildingDto.photos;
    if (updateBuildingDto.documents !== undefined) updateData.documents = updateBuildingDto.documents;
    if (updateBuildingDto.metro_stations !== undefined) updateData.metro_stations = updateBuildingDto.metro_stations;
    if (updateBuildingDto.commute_times !== undefined) updateData.commute_times = updateBuildingDto.commute_times;
    if (updateBuildingDto.local_essentials !== undefined) updateData.local_essentials = updateBuildingDto.local_essentials;
    if (updateBuildingDto.amenities !== undefined) updateData.amenities = updateBuildingDto.amenities;
    if (updateBuildingDto.is_concierge !== undefined) updateData.is_concierge = updateBuildingDto.is_concierge;
    if (updateBuildingDto.concierge_hours !== undefined) updateData.concierge_hours = updateBuildingDto.concierge_hours;
    if (updateBuildingDto.pet_policy !== undefined) updateData.pet_policy = updateBuildingDto.pet_policy;
    if (updateBuildingDto.pets !== undefined) updateData.pets = updateBuildingDto.pets;
    if (updateBuildingDto.smoking_area !== undefined) updateData.smoking_area = updateBuildingDto.smoking_area;
    if (updateBuildingDto.tenant_type !== undefined) updateData.tenant_type = updateBuildingDto.tenant_type;
    
    // Handle operator_id separately to ensure it's updated correctly
    if (operatorId !== undefined) {
      updateData.operator_id = operatorId;
      console.log("🔄 Will update operator_id to:", operatorId);
    }
    
    // Use QueryBuilder for direct update to avoid any caching issues
    const updateQueryBuilder = this.buildingRepository
      .createQueryBuilder()
      .update(Building)
      .set(updateData)
      .where("id = :id", { id: building.id });
    
    console.log("💾 Executing direct UPDATE query with operator_id:", updateData.operator_id);
    const updateResult = await updateQueryBuilder.execute();
    console.log("✅ Update result - affected rows:", updateResult.affected);
    
    // If operator_id was changed, cascade update to all related properties
    if (operatorId !== undefined) {
      console.log("🔄 Cascading operator_id update to related properties...");
      const propertiesUpdateResult = await this.propertyRepository
        .createQueryBuilder()
        .update(Property)
        .set({ operator_id: operatorId })
        .where("building_id = :buildingId", { buildingId: building.id })
        .execute();

      console.log(`✅ Updated operator_id for ${propertiesUpdateResult.affected} properties`);
    }

    // Cascade inherited fields updates to all related properties
    const inheritedFieldsUpdates: Partial<Property> = {};

    if (updateBuildingDto.address !== undefined) inheritedFieldsUpdates.address = updateBuildingDto.address;
    if (updateBuildingDto.tenant_type !== undefined) inheritedFieldsUpdates.tenant_types = updateBuildingDto.tenant_type;
    if (updateBuildingDto.amenities !== undefined) inheritedFieldsUpdates.amenities = updateBuildingDto.amenities;
    if (updateBuildingDto.is_concierge !== undefined) inheritedFieldsUpdates.is_concierge = updateBuildingDto.is_concierge;
    if (updateBuildingDto.pet_policy !== undefined) inheritedFieldsUpdates.pet_policy = updateBuildingDto.pet_policy;
    if (updateBuildingDto.smoking_area !== undefined) inheritedFieldsUpdates.smoking_area = updateBuildingDto.smoking_area;

    if (Object.keys(inheritedFieldsUpdates).length > 0) {
      console.log("🔄 Cascading inherited fields update to related properties...", inheritedFieldsUpdates);
      const inheritedFieldsUpdateResult = await this.propertyRepository
        .createQueryBuilder()
        .update(Property)
        .set(inheritedFieldsUpdates)
        .where("building_id = :buildingId", { buildingId: building.id })
        .execute();

      console.log(`✅ Updated inherited fields for ${inheritedFieldsUpdateResult.affected} properties`);
    }
    
    // Reload the building with relations to ensure we return the correct operator
    const reloadedBuilding = await this.buildingRepository.findOne({
      where: { id: building.id },
      relations: ["operator", "operator.operatorProfile", "properties"],
    });
    
    if (!reloadedBuilding) {
      throw new NotFoundException("Building not found after update");
    }
    
    console.log("🔄 Reloaded building with operator_id:", reloadedBuilding.operator_id);
    console.log("🔄 Reloaded building operator:", reloadedBuilding.operator?.id, reloadedBuilding.operator?.email);
    
    return reloadedBuilding;
  }

  async remove(id: string): Promise<{ success: boolean; message: string; id: string }> {
    try {
      // First, check if building exists
      const building = await this.buildingRepository.findOne({
        where: { id },
        relations: ["properties"],
      });
      
      if (!building) {
        throw new NotFoundException(`Building with ID ${id} not found`);
      }
      
      // Check if building has associated properties
      if (building.properties && building.properties.length > 0) {
        throw new BadRequestException(
          `Cannot delete building. It has ${building.properties.length} associated properties. Please delete or reassign the properties first.`
        );
      }
      
      // Delete the building using delete method (more reliable than remove)
      const deleteResult = await this.buildingRepository.delete(id);
      
      // Verify deletion was successful
      if (!deleteResult || deleteResult.affected === 0) {
        throw new NotFoundException(`Building with ID ${id} could not be deleted. No rows affected.`);
      }
      
      // Double-check: verify building is actually deleted
      const verifyDeleted = await this.buildingRepository.findOne({
        where: { id },
      });
      
      if (verifyDeleted) {
        throw new Error(`Building ${id} still exists after deletion attempt`);
      }
      
      console.log(`✅ Building ${id} deleted successfully. Affected rows: ${deleteResult.affected}`);
      
      return {
        success: true,
        message: "Building deleted successfully",
        id: id,
      };
    } catch (error) {
      console.error(`❌ Error deleting building ${id}:`, error);
      throw error;
    }
  }

  async getOperators(): Promise<User[]> {
    return await this.userRepository.find({
      where: { role: UserRole.Operator },
      relations: ["operatorProfile"],
      order: { created_at: "DESC" },
    });
  }
}

