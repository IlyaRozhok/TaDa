import { Building } from "../../entities/building.entity";

export type BuildingResponse = Pick<
  Building,
  | "id"
  | "name"
  | "address"
  | "number_of_units"
  | "type_of_unit"
  | "logo"
  | "video"
  | "photos"
  | "documents"
  | "metro_stations"
  | "areas"
  | "districts"
  | "amenities"
  | "pet_policy"
  | "pets"
  | "tenant_type"
  | "family_status"
  | "occupation"
  | "children"
  | "operator_id"
  | "created_at"
  | "updated_at"
>;

export const toBuildingResponse = (building: Building): BuildingResponse => ({
  id: building.id,
  name: building.name,
  address: building.address,
  number_of_units: building.number_of_units,
  type_of_unit: building.type_of_unit || [],
  logo: building.logo,
  video: building.video,
  photos: building.photos || [],
  documents: building.documents,
  metro_stations: building.metro_stations || [],
  areas: building.areas || [],
  districts: building.districts || [],
  amenities: building.amenities || [],
  pet_policy: building.pet_policy,
  pets: building.pets,
  tenant_type: building.tenant_type || [],
  family_status: building.family_status || [],
  occupation: building.occupation || [],
  children: building.children || [],
  operator_id: building.operator_id,
  created_at: building.created_at,
  updated_at: building.updated_at,
});
