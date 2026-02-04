/**
 * API Client exports
 */

export * from './base-client';

// Create and export the main API client instance
import { BaseApiClient } from './base-client';

export const apiClient = new BaseApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
});