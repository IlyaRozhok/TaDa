import axios from "axios";
import { store } from "../store/store";
import { logout } from "../store/slices/authSlice";

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Adding token to request:", config.url);
    } else {
      console.log("⚠️ No token found for request:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("❌ API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message,
    });

    // Only handle 401 errors for actual API calls
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      console.log("🔓 401 error detected:", {
        path: currentPath,
        shouldLogout:
          !currentPath.includes("/preferences") &&
          !currentPath.includes("/auth"),
      });

      // Don't logout on preferences or auth pages
      if (
        !currentPath.includes("/preferences") &&
        !currentPath.includes("/auth")
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("sessionExpiry");
        store.dispatch(logout());
      }
    }

    return Promise.reject(error);
  }
);

// API methods for different resources
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  register: (data: any) => api.post("/auth/register", data),

  googleAuth: (token: string) => api.post("/auth/google", { token }),

  selectRole: (role: string) => api.post("/auth/select-role", { role }),
};

export const usersAPI = {
  getMe: () => api.get("/auth/me"),

  update: (id: string, data: any) => api.patch(`/users/${id}`, data),

  getAll: () => api.get("/users"),

  getById: (id: string) => api.get(`/users/${id}`),
};

export const preferencesAPI = {
  get: () => api.get("/preferences"),

  create: (data: any) => api.post("/preferences", data),

  update: (data: any) => api.put("/preferences", data),
};

export const propertiesAPI = {
  getAll: (params?: any) => api.get("/properties", { params }),

  getById: (id: string) => api.get(`/properties/${id}`),

  create: (data: any) => api.post("/properties", data),

  update: (id: string, data: any) => api.patch(`/properties/${id}`, data),

  delete: (id: string) => api.delete(`/properties/${id}`),

  getFeatured: () => api.get("/featured/properties"),

  getMatched: () => api.get("/matching/matches"),
};

export const shortlistAPI = {
  get: () => api.get("/shortlist"),

  add: (propertyId: string) => api.post(`/shortlist/${propertyId}`),

  remove: (propertyId: string) => api.delete(`/shortlist/${propertyId}`),

  checkStatus: (propertyId: string) =>
    api.get(`/shortlist/check/${propertyId}`),
};

export const favouritesAPI = {
  get: () => api.get("/favourites"),

  add: (propertyId: string) => api.post(`/favourites/${propertyId}`),

  remove: (propertyId: string) => api.delete(`/favourites/${propertyId}`),
};

export const operatorAPI = {
  getDashboard: () => api.get("/operator/dashboard"),

  getProperties: () => api.get("/operator/properties"),

  getTenants: () => api.get("/operator/tenants"),
};

// Add matchingAPI for compatibility
export const matchingAPI = {
  getDetailedMatches: (limit?: number) =>
    api.get("/matching/detailed-matches", { params: { limit } }),
};

// Export types for compatibility
export type { Property, PropertyMedia } from "../types";

// Additional interfaces for useProperties
export interface PropertyFilters {
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
}

export interface MatchingResult {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

export default api;
