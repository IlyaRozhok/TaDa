import { Property } from "../../entities/property.entity";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { FindPropertiesDto } from "./dto/find-properties.dto";
import { FindAdminPropertiesDto } from "./dto/find-admin-properties.dto";

type PropertyDto = CreatePropertyDto | UpdatePropertyDto;

export const assignPropertyOptionals = (
  target: Partial<Property>,
  dto: PropertyDto,
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
      : undefined;
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

  if (dto.video !== undefined) {
    target.video = dto.video;
  }

  if (dto.documents !== undefined) {
    target.documents = dto.documents;
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
  if (dto.property_amenities !== undefined) {
    target.property_amenities = dto.property_amenities;
  }
  if (dto.family_status !== undefined) {
    target.family_status = dto.family_status;
  }
  if (dto.occupation !== undefined) {
    target.occupation = dto.occupation;
  }
  if (dto.children !== undefined) {
    target.children = dto.children;
  }
  if (dto.pet_policy !== undefined) {
    target.pet_policy = dto.pet_policy;
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
  if (dto.pets !== undefined) {
    target.pets = dto.pets;
  }

  // Admin-only. The service strips the field from the payload before it gets
  // here for every other role, so the guard is a plain "was it sent?" check.
  if (dto.is_landing_listing !== undefined) {
    target.is_landing_listing = dto.is_landing_listing;
  }

  if (dto.status !== undefined) {
    target.status = dto.status;
  }

  if (dto.epc_rating !== undefined) {
    target.epc_rating = dto.epc_rating;
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

/** The admin table shows 20 rows a page; the cap mirrors the public list's. */
const ADMIN_DEFAULT_LIMIT = 20;
const ADMIN_MAX_LIMIT = 100;

/** The admin list query, once the wire strings have been typed. */
export interface AdminFindParams {
  page: number;
  limit: number;
  search?: string;
  building_id?: string;
  operator_id?: string;
  is_landing_listing?: boolean;
  property_type?: string;
  bedrooms?: number;
  bedrooms_min?: number;
  bathrooms?: number;
  bathrooms_min?: number;
}

/** A room count: a non-negative integer, or nothing at all. */
const toRoomCount = (raw?: string): number | undefined => {
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

export const normalizeAdminFindParams = (
  dto?: FindAdminPropertiesDto,
): AdminFindParams => {
  const page = dto?.page ? parseInt(dto.page, 10) : 1;
  const limit = dto?.limit ? parseInt(dto.limit, 10) : ADMIN_DEFAULT_LIMIT;
  const search = dto?.search?.trim();
  const propertyType = dto?.property_type?.trim();

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit:
      Number.isFinite(limit) && limit > 0 && limit <= ADMIN_MAX_LIMIT
        ? limit
        : ADMIN_DEFAULT_LIMIT,
    search: search || undefined,
    building_id: dto?.building_id,
    operator_id: dto?.operator_id,
    is_landing_listing:
      dto?.is_landing_listing === undefined
        ? undefined
        : dto.is_landing_listing === "true",
    property_type: propertyType || undefined,
    bedrooms: toRoomCount(dto?.bedrooms),
    bedrooms_min: toRoomCount(dto?.bedrooms_min),
    bathrooms: toRoomCount(dto?.bathrooms),
    bathrooms_min: toRoomCount(dto?.bathrooms_min),
  };
};
