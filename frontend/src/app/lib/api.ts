import axios from "axios";
import { logout } from "../store/slices/authSlice";
import { Property } from "../types";

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
        // Use dynamic import to avoid circular dependency
        import("../store/store").then(({ store }) => {
          store.dispatch(logout());
        });
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

  checkUser: (email: string) => api.post("/auth/check-user", { email }),

  authenticate: (data: {
    email: string;
    password: string;
    role?: "tenant" | "operator";
    rememberMe?: boolean;
  }) => api.post("/auth/authenticate", data),

  googleAuth: (token: string) => api.post("/auth/google", { token }),

  selectRole: (role: string) => api.post("/auth/select-role", { role }),

  updateProfile: (data: any) => api.put("/users/profile", data),

  updateUserRole: (userId: string, data: { role: string }) =>
    api.put(`/users/${userId}/role`, data),

  getProfile: () => api.get("/users/profile"),

  logout: () => api.post("/auth/logout"),

  createGoogleUser: (registrationId: string, role: "tenant" | "operator") =>
    api.post("/auth/create-google-user", { registrationId, role }),
};

export const usersAPI = {
  getMe: () => api.get("/auth/me"),

  update: (id: string, data: any) => api.patch(`/users/${id}`, data),

  getAll: () => api.get("/users"),

  getById: (id: string) => api.get(`/users/${id}`),
};

export const preferencesAPI = {
  get: () => api.get("/preferences"),

  getPreferences: () => api.get("/preferences"),

  create: (data: any) => api.post("/preferences", data),

  update: (data: any) => api.put("/preferences", data),
};

export const propertiesAPI = {
  getAll: (params?: any) => api.get("/properties", { params }),

  getAllPublic: (params?: any) => api.get("/properties/public/all", { params }),

  getById: (id: string) => api.get(`/properties/${id}`),

  getByIdPublic: (id: string) => api.get(`/properties/public/${id}`),

  getPublic: (page: number = 1, limit: number = 6, search?: string) =>
    api.get("/properties/public", { params: { page, limit, search } }),

  create: (data: any) => api.post("/properties", data),

  update: (id: string, data: any) => api.patch(`/properties/${id}`, data),

  delete: (id: string) => api.delete(`/properties/${id}`),

  getFeatured: () => api.get("/featured/properties"),

  getMatched: () => api.get("/matching/matches"),
};

export const shortlistAPI = {
  get: () => api.get("/shortlist").then((res) => res.data),
  getAll: () => api.get("/shortlist").then((res) => res.data),
  getCount: () =>
    api.get("/shortlist/count").then((res) => res.data?.count || 0),

  add: (propertyId: string) =>
    api.post(`/shortlist/${propertyId}`).then((res) => res.data),

  remove: (propertyId: string) =>
    api.delete(`/shortlist/${propertyId}`).then((res) => res.data),

  clear: () => api.delete("/shortlist").then((res) => res.data),

  // Deprecated - should not be used anymore to avoid cycling calls
  checkStatus: (propertyId: string) =>
    api
      .get(`/shortlist/check/${propertyId}`)
      .then((res) => res.data?.isShortlisted || false),
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

  getMatches: (limit?: number) =>
    api.get("/matching/matches", { params: { limit } }),

  getRecommendations: (limit?: number) =>
    api.get("/matching/recommendations", { params: { limit } }),
};

export const propertyMediaAPI = {
  uploadPropertyMedia: async (propertyId: string, file: File) => {
    console.log(
      "📤 Uploading media for property:",
      propertyId,
      "file:",
      file.name
    );
    console.log(
      "🔑 Current token:",
      localStorage.getItem("accessToken") ? "Present" : "Missing"
    );
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post(
        `/properties/${propertyId}/media`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("✅ Upload response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Upload failed:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  },
  getPropertyMedia: async (propertyId: string) => {
    console.log("🔍 Getting media for property:", propertyId);
    const response = await api.get(`/properties/${propertyId}/media`);
    console.log("📋 Media response:", response.data);
    return response.data;
  },
  deletePropertyMedia: async (propertyId: string, mediaId: string) => {
    console.log("🗑️ Deleting media:", mediaId, "for property:", propertyId);
    const response = await api.delete(
      `/properties/${propertyId}/media/${mediaId}`
    );
    console.log("✅ Delete response:", response.data);
    return response.data;
  },
  updatePropertyMedia: (propertyId: string, mediaId: string, data: any) =>
    api.put(`/properties/${propertyId}/media/${mediaId}`, data),
  setAsPrimary: (propertyId: string, mediaId: string) =>
    api.patch(`/properties/${propertyId}/media/${mediaId}/primary`),
  setFeaturedMedia: async (propertyId: string, mediaId: string) => {
    const response = await api.put(
      `/properties/${propertyId}/media/${mediaId}/featured`
    );
    return response.data;
  },
  updateMediaOrder: async (
    propertyId: string,
    mediaOrders: { id: string; order_index: number }[]
  ) => {
    const response = await api.put(`/properties/${propertyId}/media/order`, {
      mediaOrders,
    });
    return response.data;
  },
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

// Detailed matching result from backend
export interface DetailedMatchingResult {
  property: Property;
  matchScore: number;
  matchReasons: string[];
  perfectMatch: boolean;
}

export default api;
