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
  | "is_concierge"
  | "concierge_hours"
  | "pet_policy"
  | "pets"
  | "smoking_area"
  | "tenant_type"
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
  is_concierge: building.is_concierge,
  concierge_hours: building.concierge_hours,
  pet_policy: building.pet_policy,
  pets: building.pets,
  smoking_area: building.smoking_area,
  tenant_type: building.tenant_type || [],
  operator_id: building.operator_id,
  created_at: building.created_at,
  updated_at: building.updated_at,
});
