/**
 * Common types used across the application
 */

export type ID = string;

export interface BaseEntity {
  id: ID;
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  city: string;
  postcode: string;
  country: string;
  coordinates?: Coordinates;
}

export interface MediaFile {
  id: ID;
  url: string;
  type: 'image' | 'video' | 'document';
  mime_type: string;
  original_filename: string;
  file_size: number;
  order_index: number;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};