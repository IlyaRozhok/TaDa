/**
 * Authentication API hooks using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '../endpoints/auth';
import { LoginRequest, RegisterRequest, User } from '@/shared/types/user';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
} as const;

/**
 * Get current user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: authApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Update profile cache
      queryClient.setQueryData(authKeys.profile(), data.user);
      
      // Invalidate and refetch auth-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: () => {
      // Clear any existing auth data on login failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Clear tokens and auth state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to login
      window.location.href = '/auth/login';
    },
  });
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      // Update profile cache
      queryClient.setQueryData(authKeys.profile(), updatedUser);
    },
  });
}

/**
 * Password reset request mutation
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: authApi.requestPasswordReset,
  });
}

/**
 * Password reset mutation
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });
}