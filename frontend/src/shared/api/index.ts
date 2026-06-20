export * from './client';
export * from './endpoints/properties';
export * from '@/types/api';

import { propertiesApi } from './endpoints/properties';

export const api = {
  properties: propertiesApi,
} as const;

export default api;