import axios from "axios";
import { store } from "../store/store";
import { logout } from "../store/slices/authSlice";
import { Property } from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface ApiError {
  message: string;
  statusCode?: number;
}

declare global {
  interface Window {
    __sessionManagerInitialized?: boolean;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Explicitly set credentials to false
  timeout: 10000, // 10 second timeout
  validateStatus: function (status) {
    // Consider any status code less than 500 as a success status.
    return status < 500;
  },
});

// Public API client (no auth interceptors)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
  timeout: 10000,
  validateStatus: function (status) {
    return status < 500;
  },
});

// Request interceptor для добавления JWT токена
api.interceptors.request.use(
  (config) => {
    // Получаем токен из Redux store или localStorage
    const state = store.getState();
    let token = state.auth.accessToken;

    // Если токена нет в Redux store, проверяем localStorage
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("accessToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => {
    // console.log("✅ Response received:", response.status, response.config.url);
    return response;
  },
  async (error) => {
    // console.error(
    //   "❌ Response error:",
    //   error.response?.status,
    //   error.config?.url
    // );
    // console.error("❌ Full error:", error);

    const originalRequest = error.config;

    // If we get a 401 and it's not a login/register request
    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/auth/me")
    ) {
      // console.log("🔐 API Interceptor: Received 401 error", {
      //   url: originalRequest.url,
      //   sessionManagerInitialized:
      //     typeof window !== "undefined"
      //       ? window.__sessionManagerInitialized
      //       : false,
      // });

      // Check if SessionManager is still initializing
      if (typeof window !== "undefined") {
        const sessionManagerInitialized = window.__sessionManagerInitialized;

        // If SessionManager hasn't finished initializing, don't redirect yet
        // Instead, wait a bit and let SessionManager handle the situation
        if (!sessionManagerInitialized) {
          // console.log(
          //   "🔐 API Interceptor: SessionManager still initializing, not redirecting yet"
          // );

          // Wait a bit for SessionManager to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Check again after waiting
          if (!window.__sessionManagerInitialized) {
            // console.log(
            //   "🔐 API Interceptor: SessionManager still not ready after wait, proceeding with error"
            // );
            return Promise.reject(error);
          } else {
            // console.log(
            //   "🔐 API Interceptor: SessionManager completed during wait, retrying request"
            // );
            // SessionManager completed, retry the original request
            return api.request(originalRequest);
          }
        }
      }

      // SessionManager is ready and this is still a 401, so clear auth state
      // console.log(
      //   "🔐 API Interceptor: Clearing auth state and redirecting to login"
      // );
      store.dispatch(logout());

      // Only redirect to login if we're not already on a public page
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/auth/") &&
        window.location.pathname !== "/"
      ) {
        // Add a small delay to prevent race conditions
        setTimeout(() => {
          window.location.href = "/app/auth/login";
        }, 100);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  logoutAll: () => api.post("/auth/logout-all"),
  logoutOthers: () => api.post("/auth/logout-others"),
  getSessions: () => api.get("/auth/sessions"),
  invalidateSession: (sessionId: string) =>
    api.delete(`/auth/sessions/${sessionId}`),
  updateActivity: () => api.post("/auth/activity"),
  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.put("/users/profile", data);
    return response.data;
  },
  refresh: () => api.post("/auth/refresh"),
};

export const propertiesAPI = {
  getAll: (filters?: PropertyFilters) =>
    api.get("/properties", { params: filters }),
  getById: async (id: string) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },
  create: (data: CreatePropertyRequest) => api.post("/properties", data),
  update: (id: string, data: Partial<CreatePropertyRequest>) =>
    api.patch(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  getMyProperties: () => api.get("/properties/my-properties"),
  getFeatured: async (limit?: number) => {
    const response = await api.get("/properties/featured", {
      params: { limit },
    });
    return response.data;
  },
  getMatched: async (limit?: number) => {
    const response = await api.get("/properties/matched", {
      params: { limit },
    });
    return response.data;
  },
  // Public methods (no auth required)
  getPublic: async (page: number = 1, limit: number = 6, search?: string) => {
    const response = await publicApi.get("/properties/public", {
      params: { page, limit, search },
    });
    return response.data;
  },
  getByIdPublic: async (id: string) => {
    const response = await publicApi.get(`/properties/${id}`);
    return response.data;
  },
};

// Add matching result interface
export interface MatchingResult {
  property: Property;
  matchScore: number;
  matchReasons: string[];
  perfectMatch: boolean;
}

export const matchingAPI = {
  getMatches: async (limit?: number): Promise<Property[]> => {
    const response = await api.get("/matching/matches", {
      params: { limit },
    });
    return response.data;
  },

  getDetailedMatches: async (limit?: number): Promise<MatchingResult[]> => {
    const response = await api.get("/matching/detailed-matches", {
      params: { limit },
    });
    return response.data;
  },

  getRecommendations: async (limit?: number): Promise<Property[]> => {
    const response = await api.get("/matching/recommendations", {
      params: { limit },
    });
    return response.data;
  },
};

export const preferencesAPI = {
  get: () => api.get("/preferences"),
  create: (data: PreferencesData) => api.post("/preferences", data),
  update: (data: Partial<PreferencesData>) => api.put("/preferences", data),
  delete: () => api.delete("/preferences"),
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/preferences/all", { params }),
};

// Users API (Admin functions)
export const usersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/users", { params }),
  create: (data: any) => api.post("/users", data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getCount: async (): Promise<number> => {
    const response = await api.get("/users", { params: { limit: 1 } });
    return response.data.total || 0;
  },
};

// Admin Statistics API
export const adminAPI = {
  getStatistics: async (): Promise<{
    totalUsers: number;
    totalProperties: number;
    totalMatches: number;
    totalShortlists: number;
    totalFavourites: number;
    totalPreferences: number;
    recentUsers: number;
    recentProperties: number;
  }> => {
    const [
      usersResponse,
      propertiesResponse,
      shortlistCount,
      preferencesResponse,
    ] = await Promise.all([
      api.get("/users", { params: { limit: 1 } }),
      api.get("/properties", { params: { limit: 1 } }),
      api.get("/shortlist/count").catch(() => ({ data: { count: 0 } })),
      api
        .get("/preferences/all", { params: { limit: 1 } })
        .catch(() => ({ data: { total: 0 } })),
    ]);

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsersResponse, recentPropertiesResponse] = await Promise.all([
      api
        .get("/users", {
          params: {
            limit: 1000, // Get more to filter by date
            sortBy: "created_at",
            order: "DESC",
          },
        })
        .catch(() => ({ data: { data: [] } })),
      api
        .get("/properties", {
          params: {
            limit: 1000, // Get more to filter by date
          },
        })
        .catch(() => ({ data: { data: [] } })),
    ]);

    // Filter recent users (last 30 days)
    const recentUsers =
      recentUsersResponse.data.data?.filter((user: any) => {
        const createdAt = new Date(user.created_at);
        return createdAt >= thirtyDaysAgo;
      }).length || 0;

    // Filter recent properties (last 30 days)
    const recentProperties =
      recentPropertiesResponse.data.data?.filter((property: any) => {
        const createdAt = new Date(property.created_at);
        return createdAt >= thirtyDaysAgo;
      }).length || 0;

    return {
      totalUsers: usersResponse.data.total || 0,
      totalProperties: propertiesResponse.data.total || 0,
      totalMatches: 0, // We'll implement this later
      totalShortlists: shortlistCount.data.count || 0,
      totalFavourites: 0, // We'll implement this later
      totalPreferences: preferencesResponse.data.total || 0,
      recentUsers,
      recentProperties,
    };
  },
};

// Shortlist API
export const shortlistAPI = {
  add: async (propertyId: string): Promise<{ message: string }> => {
    if (!propertyId || propertyId.trim() === "") {
      throw new Error("Property ID is required");
    }

    console.log("🔖 Adding property to shortlist:", propertyId);
    try {
      const response = await api.post(`/shortlist/${propertyId}`);
      console.log("✅ Successfully added to shortlist:", response.data);
      return response.data;
    } catch (error: unknown) {
      const err = error as any;
      console.error(
        "❌ Failed to add to shortlist:",
        err.response?.data || err.message
      );
      if (err.response?.status === 404) {
        throw new Error(
          "Property not found. Please refresh the page and try again."
        );
      } else if (err.response?.status === 409) {
        throw new Error("Property is already in your shortlist.");
      } else if (err.response?.status === 401) {
        throw new Error("Please log in to add properties to your shortlist.");
      }
      throw new Error("Failed to add property to shortlist. Please try again.");
    }
  },

  remove: async (propertyId: string): Promise<{ message: string }> => {
    if (!propertyId || propertyId.trim() === "") {
      throw new Error("Property ID is required");
    }

    console.log("🗑️ Removing property from shortlist:", propertyId);
    try {
      const response = await api.delete(`/shortlist/${propertyId}`);
      console.log("✅ Successfully removed from shortlist:", response.data);
      return response.data;
    } catch (error: unknown) {
      const err = error as any;
      console.error(
        "❌ Failed to remove from shortlist:",
        err.response?.data || err.message
      );
      if (err.response?.status === 404) {
        throw new Error("Property not found in shortlist.");
      } else if (err.response?.status === 401) {
        throw new Error("Please log in to manage your shortlist.");
      }
      throw new Error(
        "Failed to remove property from shortlist. Please try again."
      );
    }
  },

  getAll: async (): Promise<Property[]> => {
    console.log("📋 Fetching user shortlist");
    try {
      const response = await api.get("/shortlist");
      console.log(
        "✅ Successfully fetched shortlist:",
        response.data?.length || 0,
        "properties"
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as any;
      console.error(
        "❌ Failed to fetch shortlist:",
        err.response?.data || err.message
      );
      if (err.response?.status === 401) {
        throw new Error("Please log in to view your shortlist.");
      }
      throw new Error("Failed to load shortlist. Please try again.");
    }
  },

  checkStatus: async (propertyId: string): Promise<boolean> => {
    if (!propertyId || propertyId.trim() === "") {
      console.warn(
        "⚠️ checkStatus called with invalid propertyId:",
        propertyId
      );
      return false;
    }

    console.log("🔍 Checking shortlist status for property:", propertyId);
    try {
      const response = await api.get(`/shortlist/check/${propertyId}`);
      const isShortlisted = response.data.isShortlisted;
      console.log("✅ Shortlist status check result:", isShortlisted);
      return isShortlisted;
    } catch (error: unknown) {
      const err = error as any;
      console.error(
        "❌ Failed to check shortlist status:",
        err.response?.data || err.message
      );
      // For status checks, we'll return false instead of throwing to avoid breaking the UI
      if (err.response?.status === 401) {
        console.warn("⚠️ User not authenticated for shortlist status check");
        return false;
      }
      // Return false for any other errors (property not found, etc.)
      return false;
    }
  },

  getCount: async (): Promise<number> => {
    // console.log("🔢 Fetching shortlist count");
    try {
      const response = await api.get("/shortlist/count");
      // console.log("✅ Shortlist count:", response.data.count);
      return response.data.count;
    } catch (error: unknown) {
      const err = error as any;
      console.error(
        "❌ Failed to get shortlist count:",
        err.response?.data || err.message
      );
      if (err.response?.status === 401) {
        return 0; // Return 0 if not authenticated
      }
      throw new Error("Failed to get shortlist count. Please try again.");
    }
  },

  clear: async (): Promise<{ message: string }> => {
    console.log("🧹 Clearing shortlist");
    try {
      const response = await api.delete("/shortlist");
      console.log("✅ Successfully cleared shortlist:", response.data);
      return response.data;
    } catch (error: unknown) {
      const err = error as any;
      console.error(
        "❌ Failed to clear shortlist:",
        err.response?.data || err.message
      );
      if (err.response?.status === 401) {
        throw new Error("Please log in to clear your shortlist.");
      }
      throw new Error("Failed to clear shortlist. Please try again.");
    }
  },
};

// Debug function to test API connectivity
export async function testAPIConnection() {
  console.log("🧪 Testing API connection...");
  console.log("🌐 API Base URL:", API_BASE_URL);

  try {
    // Test basic connectivity
    const response = await fetch(`${API_BASE_URL}/api/docs`, {
      method: "HEAD",
      mode: "cors",
    });
    console.log("✅ Basic connectivity test:", response.status);

    // Test login endpoint without auth
    const loginTest = await api.post("/auth/login", {
      email: "test@example.com",
      password: "wrong",
    });
    console.log("📞 Login test:", loginTest.status);
  } catch (error) {
    console.error("❌ API test failed:", error);
  }
}

// Функция для проверки авторизации при загрузке приложения
export async function checkAuthStatus(): Promise<{
  user: User;
  accessToken: string;
} | null> {
  try {
    // Сначала проверяем есть ли токен в localStorage
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return null;
    }

    // Устанавливаем токен в axios для этого запроса
    const response = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      user: response.data.user,
      accessToken: token,
    };
  } catch (apiError) {
    console.log("Auth check failed:", apiError);
    // Если токен недействителен, удаляем его
    localStorage.removeItem("accessToken");
    return null;
  }
}

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
  work_style?: string;
  age?: number;
  created_at: string;
  updated_at: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role?: "tenant" | "operator" | "admin";
  full_name?: string;
  phone?: string;
  bio?: string;
  occupation?: string;
  industry?: string;
  work_style?: string;
  lifestyle?: string[];
  pets?: string;
  smoker?: boolean;
  age_range?: string;
  company_name?: string;
  position?: string;
  business_type?: string;
  business_address?: string;
  years_experience?: number;
  operating_areas?: string[];
  business_description?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
  age_range?: string;
  industry?: string;
  work_style?: string;
  lifestyle?: string;
  pets?: string;
  smoker?: boolean;
  hobbies?: string;
  ideal_living_environment?: string;
  additional_info?: string;
}

export interface PropertyFilters {
  city?: string;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
}

export interface MatchingCriteria {
  max_price?: number;
  preferred_areas?: string[];
  lifestyle_preferences?: string[];
}

export interface PreferencesData {
  primary_postcode?: string;
  secondary_location?: string;
  commute_location?: string;
  commute_time_walk?: number;
  commute_time_cycle?: number;
  commute_time_tube?: number;
  move_in_date?: string;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  furnishing?: string;
  let_duration?: string;
  property_type?: string;
  building_style?: string[];
  designer_furniture?: boolean;
  house_shares?: string;
  date_property_added?: string;
  lifestyle_features?: string[];
  social_features?: string[];
  work_features?: string[];
  convenience_features?: string[];
  pet_friendly_features?: string[];
  luxury_features?: string[];
  hobbies?: string[];
  ideal_living_environment?: string;
  pets?: string;
  smoker?: boolean;
  additional_info?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Preferences {
  id?: string;
  location?: string;
  max_budget?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  property_type?: string;
  furnishing?: string;
  lifestyle_preferences?: string[];
  move_in_date?: string;
  lease_duration?: string;
  additional_requirements?: string;
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnishing: string;
  lifestyle_features?: string[];
  available_from: string;
  is_btr?: boolean;
}
