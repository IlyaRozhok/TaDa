/**
 * Properties API endpoints
 */

import { apiClient } from '../client';
import { 
  Property, 
  PropertySearchFilters, 
  CreatePropertyRequest, 
  UpdatePropertyRequest,
  PropertyListResponse 
} from '@/shared/types/property';
import { PaginationParams } from '@/shared/types/common';

export const propertiesApi = {
  /**
   * Get all properties with optional filters and pagination
   */
  getAll: async (params?: Partial<PaginationParams & PropertySearchFilters>): Promise<PropertyListResponse> => {
    const response = await apiClient.get<PropertyListResponse>('/properties', {
      params,
    });
    return response.data;
  },

  /**
   * Get property by ID
   */
  getById: async (id: string): Promise<Property> => {
    const response = await apiClient.get<Property>(`/properties/${id}`);
    return response.data;
  },

  /**
   * Create new property
   */
  create: async (propertyData: CreatePropertyRequest): Promise<Property> => {
    const response = await apiClient.post<Property>('/properties', propertyData);
    return response.data;
  },

  /**
   * Update property
   */
  update: async (id: string, propertyData: UpdatePropertyRequest): Promise<Property> => {
    const response = await apiClient.put<Property>(`/properties/${id}`, propertyData);
    return response.data;
  },

  /**
   * Delete property
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/properties/${id}`);
  },

  /**
   * Search properties
   */
  search: async (filters: PropertySearchFilters, pagination?: PaginationParams): Promise<PropertyListResponse> => {
    const response = await apiClient.post<PropertyListResponse>('/properties/search', {
      filters,
      pagination,
    });
    return response.data;
  },

  /**
   * Get featured properties
   */
  getFeatured: async (limit = 10): Promise<Property[]> => {
    const response = await apiClient.get<Property[]>('/properties/featured', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get similar properties
   */
  getSimilar: async (propertyId: string, limit = 5): Promise<Property[]> => {
    const response = await apiClient.get<Property[]>(`/properties/${propertyId}/similar`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Upload property images
   */
  uploadImages: async (
    propertyId: string, 
    files: File[], 
    onProgress?: (progress: number) => void
  ): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });

    const response = await apiClient.upload<string[]>(
      `/properties/${propertyId}/images`,
      formData,
      onProgress
    );
    return response.data;
  },

  /**
   * Delete property image
   */
  deleteImage: async (propertyId: string, imageId: string): Promise<void> => {
    await apiClient.delete<void>(`/properties/${propertyId}/images/${imageId}`);
  },

  /**
   * Update property status
   */
  updateStatus: async (id: string, status: Property['status']): Promise<Property> => {
    const response = await apiClient.patch<Property>(`/properties/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Get properties by operator
   */
  getByOperator: async (operatorId: string, params?: Partial<PaginationParams>): Promise<PropertyListResponse> => {
    const response = await apiClient.get<PropertyListResponse>(`/properties/operator/${operatorId}`, {
      params,
    });
    return response.data;
  },
} as const;