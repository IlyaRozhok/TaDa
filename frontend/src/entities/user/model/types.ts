export interface User {
  id: string;
  email: string;
  role: 'tenant' | 'operator';
  full_name?: string;
  avatar_url?: string;
  tenantProfile?: TenantProfile;
  operatorProfile?: OperatorProfile;
}

export interface TenantProfile {
  id: string;
  user_id: string;
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

export interface OperatorProfile {
  id: string;
  user_id: string;
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

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  address?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
  avatar_url?: string;
}
