import axios from "axios";
import { logout } from "../store/slices/authSlice";
import { Property } from "../types";

// Create axios instance
const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}` || "http://localhost:5001/api",
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
    // Only handle 401 errors for actual API calls
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      // Don't logout on preferences, auth, or onboarding pages
      if (
        !currentPath.includes("/preferences") &&
        !currentPath.includes("/auth") &&
        !currentPath.includes("/onboarding")
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

  updateProfile: (data: any) => api.put("/users/profile", data),

  updateUserRole: (userId: string, data: { role: string }) =>
    api.put(`/users/${userId}/role`, data),

  getProfile: () => api.get("/users/profile"),

  getMe: () => api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),

  getTempTokenInfo: (tempToken: string) =>
    api.get(`/auth/temp-token/${tempToken}`),
};

export const usersAPI = {
  getMe: () => api.get("/auth/me"),

  update: (id: string, data: any) => api.patch(`/users/${id}`, data),

  getAll: (params?: {
    role?: string;
    limit?: number;
    page?: number;
    search?: string;
  }) => api.get("/users", { params }),

  getById: (id: string) => api.get(`/users/${id}`),
};

export const preferencesAPI = {
  get: () => api.get("/preferences"),

  getPreferences: () => api.get("/preferences"),

  create: (data: any) => api.post("/preferences", data),

  update: (data: any) => api.put("/preferences", data),
};

// Removed duplicate - see propertiesAPI definition below

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

export const operatorAPI = {
  getDashboard: () => api.get("/operator/dashboard"),

  getProperties: () => api.get("/operator/properties"),

  getTenants: () => api.get("/operator/tenants"),
};

// Add matchingAPI for compatibility
export const matchingAPI = {
  getDetailedMatches: (limit?: number) =>
    api.get("/matching/detailed-matches", { params: { limit } }),

  // getMatches: (limit?: number) =>
  //   api.get("/matching/matches", { params: { limit } }),

  getRecommendations: (limit?: number) =>
    api.get("/matching/recommendations", { params: { limit } }),

  getMatchedPropertiesWithPagination: (
    page?: number,
    limit?: number,
    search?: string
  ) =>
    api.get("/matching/matched-properties", {
      params: { page, limit, search },
    }),
};

export const operatorsAPI = {
  getAll: () => api.get("/residential-complexes/operators"),
};

export const residentialComplexesAPI = {
  getAll: (params?: any) => api.get("/residential-complexes", { params }),
  getById: (id: string) => api.get(`/residential-complexes/${id}`),
  create: (data: any) => api.post("/residential-complexes", data),
  update: (id: string, data: any) =>
    api.patch(`/residential-complexes/${id}`, data),
  delete: (id: string) => api.delete(`/residential-complexes/${id}`),
};

export const buildingsAPI = {
  getAll: (params?: any) => api.get("/buildings", { params }),
  getById: (id: string) => api.get(`/buildings/${id}`),
  create: (data: any) => api.post("/buildings", data),
  update: (id: string, data: any) => api.patch(`/buildings/${id}`, data),
  delete: (id: string) => api.delete(`/buildings/${id}`),
  getOperators: () => api.get("/buildings/operators"),
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const response = await api.post("/buildings/upload/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
  uploadVideo: async (file: File) => {
    const formData = new FormData();
    formData.append("video", file);
    try {
      const response = await api.post("/buildings/upload/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
  uploadPhotos: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append("photos", file);
    });
    try {
      const response = await api.post("/buildings/upload/photos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
  uploadDocuments: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append("documents", file);
    });
    try {
      const response = await api.post("/buildings/upload/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export const propertiesAPI = {
  // Admin CRUD operations
  getAll: (params?: any) => api.get("/properties", { params }),
  getById: (id: string) => api.get(`/properties/${id}`),
  create: (data: any) => api.post("/properties", data),
  update: (id: string, data: any) => api.patch(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),

  // Public endpoints
  getAllPublic: (params?: any) => api.get("/properties/public/all", { params }),
  getByIdPublic: (id: string) => api.get(`/properties/public/${id}`),
  getPublic: (page: number = 1, limit: number = 12, search?: string) =>
    api.get("/properties/public", { params: { page, limit, search } }),
  getMatched: () => api.get("/matching/matches"),

  // Media upload endpoints
  uploadPhotos: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("photos", file);
    });
    try {
      const response = await api.post("/properties/upload/photos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
  uploadVideo: async (file: File) => {
    const formData = new FormData();
    formData.append("video", file);
    try {
      const response = await api.post("/properties/upload/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
  uploadDocuments: async (file: File) => {
    const formData = new FormData();
    formData.append("documents", file);
    try {
      const response = await api.post(
        "/properties/upload/documents",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export const propertyMediaAPI = {
  uploadPropertyMedia: async (propertyId: string, file: File) => {
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
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
  getPropertyMedia: async (propertyId: string) => {
    const response = await api.get(`/properties/${propertyId}/media`);
    return response.data;
  },
  deletePropertyMedia: async (propertyId: string, mediaId: string) => {
    const response = await api.delete(
      `/properties/${propertyId}/media/${mediaId}`
    );
    return response.data;
  },
  updatePropertyMedia: (propertyId: string, mediaId: string, data: any) =>
    api.put(`/properties/${propertyId}/media/${mediaId}`, data),
  setAsPrimary: (propertyId: string, mediaId: string) =>
    api.patch(`/properties/${propertyId}/media/${mediaId}/primary`),

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
  min_price?: number;
  max_price?: number;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: string;
  tenant_types?: string[];
  amenities?: string[];
  min_square_meters?: number;
  max_square_meters?: number;
}

// Sorting and pagination options
export interface SortOptions {
  sortBy: "price" | "date" | "bedrooms" | "square_meters" | "relevance";
  sortDirection: "asc" | "desc";
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

// Combined filtering options
export interface PropertyQueryOptions
  extends PropertyFilters,
    SortOptions,
    PaginationOptions {}

export interface MatchingResult {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

// Category match result from backend
export interface CategoryMatchResult {
  category: string;
  match: boolean;
  score: number;
  maxScore: number;
  reason: string;
  details?: string;
}

// Category match result from backend
export interface CategoryMatchResult {
  category: string;
  match: boolean;
  score: number;
  maxScore: number;
  reason: string;
  details?: string;
  hasPreference: boolean; // New field - indicates if user has set preference
}

// Detailed matching result from backend (updated structure)
export interface DetailedMatchingResult {
  property: Property;
  totalScore: number;
  maxPossibleScore: number;
  matchPercentage: number; // This is the new matchScore
  isPerfectMatch: boolean;
  categories: CategoryMatchResult[];
  summary: {
    matched: number;
    partial: number;
    notMatched: number;
    skipped: number; // New field - categories without preference
  };
}

// Legacy compatibility - computed fields for backward compatibility
export interface DetailedMatchingResultLegacy extends DetailedMatchingResult {
  matchScore: number; // Alias for matchPercentage
  matchReasons: string[]; // Computed from categories
}

// Full matching response from backend
export interface MatchingResponse {
  results: DetailedMatchingResult[];
  total: number;
  preferences: {
    id: string;
    summary: string;
  };
  appliedWeights: Record<string, number>;
}

export default api;
