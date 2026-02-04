/**
 * Authentication API endpoints
 */

import { apiClient } from '../client';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User 
} from '@/shared/types/user';
import { ApiResponse } from '@/shared/types/api';

export const authApi = {
  /**
   * User login
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * User registration
   */
  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', userData);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * User logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post<void>('/auth/logout');
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', profileData);
    return response.data;
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post<void>('/auth/forgot-password', { email });
  },

  /**
   * Reset password
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post<void>('/auth/reset-password', {
      token,
      password: newPassword,
    });
  },

  /**
   * Verify email
   */
  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post<void>('/auth/verify-email', { token });
  },

  /**
   * Resend verification email
   */
  resendVerification: async (email: string): Promise<void> => {
    await apiClient.post<void>('/auth/resend-verification', { email });
  },
} as const;