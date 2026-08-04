import axios from "axios";
import { logout } from "@/store/slices/authSlice";

// Create axios instance
const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}` || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Required so httpOnly auth cookies set by the API origin are sent on XHR/fetch
  // (e.g. localhost:3000 → localhost:5001 after Google OAuth redirect).
  withCredentials: true,
});

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      if (
        !currentPath.includes("/preferences") &&
        !currentPath.includes("/auth") &&
        !currentPath.includes("/onboarding")
      ) {
        import("@/store/store").then(({ store }) => {
          store.dispatch(logout());
        });
      }
    }

    return Promise.reject(error);
  },
);

// API methods for different resources
export const authAPI = {
  updateProfile: (data: any) => api.put("/users/profile", data),

  getProfile: () => api.get("/users/profile"),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getMe: () => api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),
};

/**
 * Only the uploads are left here. The JSON endpoints moved to
 * `store/api/buildings.api.ts`; these four stay on axios because they post
 * multipart bodies, and one of them reports upload progress and raises the
 * timeout to five minutes — neither has an equivalent in `fetchBaseQuery`.
 */
export const buildingsAPI = {
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
      console.log("📤 Отправка видео на сервер:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      });

      const response = await api.post("/buildings/upload/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // Add timeout for large video files (5 minutes)
        timeout: 5 * 60 * 1000,
        // Track upload progress
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            console.log(`📊 Прогресс загрузки: ${percentCompleted}%`);
          }
        },
      });

      console.log("✅ Ответ сервера:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка API при загрузке видео:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
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

/**
 * Only the uploads are left here. The JSON endpoints live in
 * `store/api/properties.api.ts`; these three stay on axios because they post
 * multipart bodies, and the video one reports progress and raises the timeout
 * to five minutes — neither has an equivalent in `fetchBaseQuery`.
 */
export const propertiesAPI = {
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
      console.log("📤 Отправка видео на сервер:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      });

      const response = await api.post("/properties/upload/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // Add timeout for large video files (5 minutes)
        timeout: 5 * 60 * 1000,
        // Track upload progress
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            console.log(`📊 Прогресс загрузки: ${percentCompleted}%`);
          }
        },
      });

      console.log("✅ Ответ сервера:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Ошибка API при загрузке видео:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      // Provide more detailed error messages
      if (error.response) {
        // Server responded with error status
        const serverMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          "Ошибка сервера";
        const errorWithDetails = new Error(serverMessage);
        (errorWithDetails as any).status = error.response.status;
        (errorWithDetails as any).response = error.response.data;
        throw errorWithDetails;
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(
          "Не удалось подключиться к серверу. Проверьте интернет-соединение.",
        );
      } else {
        // Something else happened
        throw new Error(
          error.message || "Неизвестная ошибка при загрузке видео",
        );
      }
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
        },
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default api;
