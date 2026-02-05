import { AxiosError, AxiosResponse } from "axios";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: ApiError;
}

export const handleApiError = (error: AxiosError): ApiError => {
  console.error("API Error:", {
    status: error.response?.status,
    url: error.config?.url,
    message: (error.response?.data as any)?.message || (error as any).message,
  });

  // Handle different types of errors
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data as any;

    switch (status) {
      case 400:
        return {
          message: data?.message || "Bad request. Please check your input.",
          status,
          details: data,
        };
      case 401:
        return {
          message: "Unauthorized. Please log in again.",
          status,
          code: "UNAUTHORIZED",
        };
      case 403:
        return {
          message: "Access denied. You don't have permission for this action.",
          status,
          code: "FORBIDDEN",
        };
      case 404:
        return {
          message: "Resource not found.",
          status,
          code: "NOT_FOUND",
        };
      case 422:
        return {
          message:
            data?.message || "Validation error. Please check your input.",
          status,
          details: data?.errors || data,
        };
      case 500:
        return {
          message: "Server error. Please try again later.",
          status,
          code: "SERVER_ERROR",
        };
      default:
        return {
          message: data?.message || `Request failed with status ${status}`,
          status,
          details: data,
        };
    }
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: "Network error. Please check your connection.",
      code: "NETWORK_ERROR",
    };
  } else {
    // Something else happened
    return {
      message: error.message || "An unexpected error occurred.",
      code: "UNKNOWN_ERROR",
    };
  }
};

export const processApiResponse = <T>(response: AxiosResponse<T>): T => {
  // Handle different response structures
  if (response.data && typeof response.data === "object") {
    // If the response has a data property, return it
    if ("data" in response.data) {
      return (response.data as any).data;
    }
  }

  // Otherwise return the response data directly
  return response.data;
};

export const createApiResponse = <T>(
  data: T,
  success: boolean = true,
  error?: ApiError
): ApiResponse<T> => {
  return {
    data,
    success,
    error,
  };
};

export const isNetworkError = (error: ApiError): boolean => {
  return error.code === "NETWORK_ERROR";
};

export const isAuthError = (error: ApiError): boolean => {
  return error.status === 401 || error.code === "UNAUTHORIZED";
};

export const isValidationError = (error: ApiError): boolean => {
  return error.status === 422;
};

export const isServerError = (error: ApiError): boolean => {
  return error.status === 500 || error.code === "SERVER_ERROR";
};

// Retry logic for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

// Debounce function for API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
