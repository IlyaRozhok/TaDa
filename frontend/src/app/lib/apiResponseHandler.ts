import { AxiosResponse } from "axios";
import { handleApiError, processApiResponse } from "./apiUtils";

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export class ApiResponseHandler {
  static async handleResponse<T>(
    apiCall: () => Promise<AxiosResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiCall();
      const data = processApiResponse(response);

      return {
        data,
        success: true,
        message: response.data?.message,
      };
    } catch (error: any) {
      const apiError = handleApiError(error);

      return {
        data: null as any,
        success: false,
        message: apiError.message,
        errors: apiError.details?.errors || {},
      };
    }
  }

  static async handlePaginatedResponse<T>(
    apiCall: () => Promise<
      AxiosResponse<{
        data: T[];
        total: number;
        totalPages: number;
        currentPage: number;
      }>
    >
  ): Promise<PaginatedResponse<T>> {
    try {
      const response = await apiCall();
      const responseData = response.data;

      return {
        data: responseData.data || [],
        success: true,
        message: responseData.message,
        pagination: {
          currentPage: responseData.currentPage || 1,
          totalPages: responseData.totalPages || 1,
          totalItems: responseData.total || 0,
          itemsPerPage: responseData.data?.length || 0,
        },
      };
    } catch (error: any) {
      const apiError = handleApiError(error);

      return {
        data: [],
        success: false,
        message: apiError.message,
        errors: apiError.details?.errors || {},
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 0,
        },
      };
    }
  }

  static async handleListResponse<T>(
    apiCall: () => Promise<AxiosResponse<T[]>>
  ): Promise<ApiResponse<T[]>> {
    try {
      const response = await apiCall();
      const data = processApiResponse(response);

      return {
        data: Array.isArray(data) ? data : [],
        success: true,
        message: response.data?.message,
      };
    } catch (error: any) {
      const apiError = handleApiError(error);

      return {
        data: [],
        success: false,
        message: apiError.message,
        errors: apiError.details?.errors || {},
      };
    }
  }

  static async handleCreateResponse<T>(
    apiCall: () => Promise<AxiosResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiCall();
      const data = processApiResponse(response);

      return {
        data,
        success: true,
        message: "Created successfully",
      };
    } catch (error: any) {
      const apiError = handleApiError(error);

      return {
        data: null as any,
        success: false,
        message: apiError.message,
        errors: apiError.details?.errors || {},
      };
    }
  }

  static async handleUpdateResponse<T>(
    apiCall: () => Promise<AxiosResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiCall();
      const data = processApiResponse(response);

      return {
        data,
        success: true,
        message: "Updated successfully",
      };
    } catch (error: any) {
      const apiError = handleApiError(error);

      return {
        data: null as any,
        success: false,
        message: apiError.message,
        errors: apiError.details?.errors || {},
      };
    }
  }

  static async handleDeleteResponse(
    apiCall: () => Promise<AxiosResponse<void>>
  ): Promise<ApiResponse<void>> {
    try {
      await apiCall();

      return {
        data: undefined as any,
        success: true,
        message: "Deleted successfully",
      };
    } catch (error: any) {
      const apiError = handleApiError(error);

      return {
        data: undefined as any,
        success: false,
        message: apiError.message,
        errors: apiError.details?.errors || {},
      };
    }
  }
}

// Utility functions for common API patterns
export const withErrorHandling = <T>(
  apiCall: () => Promise<AxiosResponse<T>>
): Promise<ApiResponse<T>> => {
  return ApiResponseHandler.handleResponse(apiCall);
};

export const withPaginatedErrorHandling = <T>(
  apiCall: () => Promise<
    AxiosResponse<{
      data: T[];
      total: number;
      totalPages: number;
      currentPage: number;
    }>
  >
): Promise<PaginatedResponse<T>> => {
  return ApiResponseHandler.handlePaginatedResponse(apiCall);
};

export const withListErrorHandling = <T>(
  apiCall: () => Promise<AxiosResponse<T[]>>
): Promise<ApiResponse<T[]>> => {
  return ApiResponseHandler.handleListResponse(apiCall);
};
