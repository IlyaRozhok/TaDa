import { Property } from "../../entities/property.entity";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { FindPropertiesDto } from "./dto/find-properties.dto";

type PropertyDto = CreatePropertyDto | UpdatePropertyDto;

export const assignPropertyOptionals = (
  target: Partial<Property>,
  dto: PropertyDto
): void => {
  if (dto.apartment_number !== undefined) {
    target.apartment_number = dto.apartment_number;
  }

  if (dto.title !== undefined) {
    target.title = dto.title;
  }

  if (dto.descriptions !== undefined) {
    target.descriptions = dto.descriptions;
  }

  if (dto.property_type !== undefined) {
    target.property_type = dto.property_type;
  }

  if (dto.furnishing !== undefined) {
    target.furnishing = dto.furnishing;
  }

  if (dto.bills !== undefined) {
    target.bills = dto.bills;
  }

  if (dto.available_from !== undefined) {
    target.available_from = dto.available_from
      ? new Date(dto.available_from)
      : null;
  }

  if (dto.building_type !== undefined) {
    target.building_type = dto.building_type;
  }

  if (dto.let_duration !== undefined) {
    target.let_duration = dto.let_duration;
  }

  if (dto.floor !== undefined) {
    target.floor = dto.floor;
  }

  if (dto.square_meters !== undefined) {
    target.square_meters = dto.square_meters;
  }

  if (dto.outdoor_space !== undefined) {
    target.outdoor_space = dto.outdoor_space;
  }

  if (dto.balcony !== undefined) {
    target.balcony = dto.balcony;
  }

  if (dto.terrace !== undefined) {
    target.terrace = dto.terrace;
  }

  if (dto.price !== undefined) {
    target.price = dto.price;
  }

  if (dto.deposit !== undefined) {
    target.deposit = dto.deposit;
  }

  if (dto.bedrooms !== undefined) {
    target.bedrooms = dto.bedrooms;
  }

  if (dto.bathrooms !== undefined) {
    target.bathrooms = dto.bathrooms;
  }

  if (dto.photos !== undefined) {
    target.photos = dto.photos;
  }

  if (dto.luxury !== undefined) {
    target.luxury = dto.luxury;
  }

  // inherited/array fields
  if (dto.address !== undefined) {
    target.address = dto.address;
  }
  if (dto.tenant_types !== undefined) {
    target.tenant_types = dto.tenant_types;
  }
  if (dto.amenities !== undefined) {
    target.amenities = dto.amenities;
  }
  if (dto.is_concierge !== undefined) {
    target.is_concierge = dto.is_concierge;
  }
  if (dto.pet_policy !== undefined) {
    target.pet_policy = dto.pet_policy;
  }
  if (dto.smoking_area !== undefined) {
    target.smoking_area = dto.smoking_area;
  }
  if (dto.metro_stations !== undefined) {
    target.metro_stations = dto.metro_stations;
  }
  if (dto.commute_times !== undefined) {
    target.commute_times = dto.commute_times;
  }
  if (dto.local_essentials !== undefined) {
    target.local_essentials = dto.local_essentials;
  }
  if (dto.concierge_hours !== undefined) {
    target.concierge_hours = dto.concierge_hours;
  }
  if (dto.pets !== undefined) {
    target.pets = dto.pets;
  }
};

export const normalizeFindParams = (dto?: FindPropertiesDto) => {
  const page = dto?.page ? parseInt(dto.page, 10) : 1;
  const limit = dto?.limit ? parseInt(dto.limit, 10) : 12;
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 12;
  const search = dto?.search?.trim();

  return { page: safePage, limit: safeLimit, search: search || undefined };
};
