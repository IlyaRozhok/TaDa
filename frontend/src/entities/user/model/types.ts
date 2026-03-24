// Personal profile fields now live directly in the users table.
// TenantProfile / OperatorProfile retain onboarding-specific data (lifestyle, etc.).

export interface User {
  id: string;
  email: string;
  role: 'tenant' | 'operator' | 'admin';
  // Personal info — stored in users table
  first_name?: string;
  last_name?: string;
  full_name?: string;
  address?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  avatar_url?: string;
  tenantProfile?: TenantProfile;
  operatorProfile?: OperatorProfile;
}

export interface TenantProfile {
  id: string;
  userId?: string;
  // Mirrored from users (for backward compat)
  first_name?: string;
  last_name?: string;
  full_name?: string;
  address?: string;
  phone?: string;
  date_of_birth?: string | Date;
  nationality?: string;
  // Onboarding-specific fields
  occupation?: string;
  age_range?: string;
  industry?: string;
  work_style?: string;
  lifestyle?: string[];
  ideal_living_environment?: string;
  additional_info?: string;
  shortlisted_properties?: string[];
}

export interface OperatorProfile {
  id: string;
  userId?: string;
  full_name?: string;
  phone?: string;
  company_name?: string;
  business_address?: string;
  business_description?: string;
  years_experience?: number;
  operating_areas?: string[];
}

// Fields sent to PUT /api/users/profile
export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  address?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  avatar_url?: string;
  occupation?: string;
}
