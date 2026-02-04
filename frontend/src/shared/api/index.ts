/**
 * Centralized API exports
 * 
 * This is the main entry point for all API interactions.
 * All components should import API methods from here.
 */

// Client
export * from './client';

// Endpoints
export * from './endpoints/auth';
export * from './endpoints/properties';
// export * from './endpoints/buildings';
// export * from './endpoints/users';
// export * from './endpoints/preferences';

// Types
export * from '../types/api';

// Main API object for convenient access
import { authApi } from './endpoints/auth';
import { propertiesApi } from './endpoints/properties';

export const api = {
  auth: authApi,
  properties: propertiesApi,
  // buildings: buildingsApi,
  // users: usersApi,
  // preferences: preferencesApi,
} as const;

// Default export for convenience
export default api;