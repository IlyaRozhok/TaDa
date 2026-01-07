import { Property } from "../../entities/property.entity";

// Minimal public-facing projection; adjust if more fields should be exposed
export type PublicPropertyResponse = {
  id: string;
  title: string | null;
  address: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  photos: string[];
  building_type: Property["building_type"] | null;
  available_from: Date | null;
  created_at: Date;
  building?: {
    id: string;
    name: string;
    address?: string;
  } | null;
};

export const toPublicProperty = (
  property: Property
): PublicPropertyResponse => {
  // Convert decimal price to number (TypeORM may return it as string)
  let price: number | null = null;
  if (property.price !== null && property.price !== undefined) {
    if (typeof property.price === 'string') {
      const parsed = parseFloat(property.price);
      price = isNaN(parsed) ? null : parsed;
    } else {
      price = Number(property.price);
    }
  }

  // Convert decimal square_meters to number
  let square_meters: number | null = null;
  if (property.square_meters !== null && property.square_meters !== undefined) {
    if (typeof property.square_meters === 'string') {
      const parsed = parseFloat(property.square_meters);
      square_meters = isNaN(parsed) ? null : parsed;
    } else {
      square_meters = Number(property.square_meters);
    }
  }

  return {
    id: property.id,
    title: property.title || null,
    address: property.address || null,
    price,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    square_meters,
    photos: Array.isArray(property.photos) ? property.photos : [],
    building_type: property.building_type || null,
    available_from: property.available_from || null,
    created_at: property.created_at,
    building: property.building ? {
      id: property.building.id,
      name: property.building.name,
      address: property.building.address || undefined,
    } : null,
  };
};
