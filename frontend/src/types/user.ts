/**
 * User domain types
 */

import { BaseEntity, ID, MediaFile } from './common';

export type UserRole = 'tenant' | 'operator' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface User extends BaseEntity {
  email: string;
  role: UserRole;
  status: UserStatus;
  full_name?: string;
  avatar_url?: string;
  tenantProfile?: TenantProfile;
  operatorProfile?: OperatorProfile;
  // Auth related
  isOnboarded?: boolean;
  lastLoginAt?: string;
}

export interface BaseProfile extends BaseEntity {
  user_id: ID;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  address?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
  avatar_url?: string;
  photo_url?: string;
}

export interface TenantProfile extends BaseProfile {
  // Tenant specific fields
  student_status?: boolean;
  employment_status?: string;
  annual_income?: number;
  guarantor_required?: boolean;
  references?: Reference[];
}

export interface OperatorProfile extends BaseProfile {
  // Operator specific fields
  company_name?: string;
  company_registration?: string;
  license_number?: string;
  website?: string;
  description?: string;
}

export interface Reference {
  id: ID;
  type: 'employer' | 'previous_landlord' | 'personal';
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  relationship?: string;
}

// API DTOs
export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  full_name?: string;
}

export interface UpdateUserRequest {
  full_name?: string;
  avatar_url?: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  address?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
  avatar_url?: string;
  // Profile specific fields can be added based on role
  [key: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest extends CreateUserRequest {
  confirmPassword: string;
  acceptTerms: boolean;
}