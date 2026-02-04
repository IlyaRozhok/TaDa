/**
 * Base API Client
 * 
 * Centralized HTTP client with authentication, error handling, and request/response interceptors.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

import { ApiResponse, ApiError, ApiRequestConfig } from '@/shared/types/api';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class BaseApiClient {
  private readonly client: AxiosInstance;
  private readonly config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(this.transformError(error))
    );

    // Response interceptor - handle errors and transform responses
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const transformedError = this.transformError(error);
        
        // Handle 401 - unauthorized
        if (error.response?.status === 401) {
          await this.handleUnauthorized();
        }

        // Retry logic for network errors
        if (this.shouldRetry(error) && error.config) {
          return this.retryRequest(error.config);
        }

        return Promise.reject(transformedError);
      }
    );
  }

  private getAuthToken(): string | null {
    // Get token from localStorage, Redux store, or other storage
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  }

  private async handleUnauthorized(): Promise<void> {
    // Clear auth state and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // You could dispatch a Redux action here to update auth state
      window.location.href = '/auth/login';
    }
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600) ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT'
    );
  }

  private async retryRequest(config: AxiosRequestConfig & { _retryCount?: number }): Promise<AxiosResponse> {
    const retryCount = config._retryCount || 0;
    
    if (retryCount >= this.config.retries) {
      throw new Error('Max retries exceeded');
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));

    config._retryCount = retryCount + 1;
    return this.client.request(config);
  }

  private transformError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      statusCode: error.response?.status || 0,
      details: error.response?.data || {},
    };

    // Handle specific error formats from backend
    if (error.response?.data) {
      const responseData = error.response.data as any;
      apiError.message = responseData.message || responseData.error || apiError.message;
      apiError.code = responseData.code || apiError.code;
      apiError.details = responseData.details || responseData;
    }

    return apiError;
  }

  // Public API methods
  public async get<T>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  public async post<T, D = unknown>(url: string, data?: D, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async put<T, D = unknown>(url: string, data?: D, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async patch<T, D = unknown>(url: string, data?: D, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // File upload with progress
  public async upload<T>(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Get raw axios instance for advanced use cases
  public getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}