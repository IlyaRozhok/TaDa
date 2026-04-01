import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store/store";

// Generic error handler for async thunks
export const handleAsyncThunkError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Helper to create authenticated fetch request (cookies sent automatically via credentials)
export const createAuthenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
};

// Generic async thunk creator for GET requests
export const createGetThunk = <T>(
  name: string,
  url: string | ((arg: any) => string)
) => {
  return createAsyncThunk<T, any, { state: RootState }>(
    name,
    async (arg, { rejectWithValue }) => {
      try {
        const endpoint = typeof url === "function" ? url(arg) : url;
        const response = await createAuthenticatedFetch(endpoint);
        return await response.json();
      } catch (error) {
        return rejectWithValue(handleAsyncThunkError(error));
      }
    }
  );
};

// Generic async thunk creator for POST requests
export const createPostThunk = <T, P>(
  name: string,
  url: string | ((arg: P) => string)
) => {
  return createAsyncThunk<T, P, { state: RootState }>(
    name,
    async (arg, { rejectWithValue }) => {
      try {
        const endpoint = typeof url === "function" ? url(arg) : url;
        const response = await createAuthenticatedFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(arg),
        });
        return await response.json();
      } catch (error) {
        return rejectWithValue(handleAsyncThunkError(error));
      }
    }
  );
};

// Generic async thunk creator for PUT requests
export const createPutThunk = <T, P>(
  name: string,
  url: string | ((arg: P) => string)
) => {
  return createAsyncThunk<T, P, { state: RootState }>(
    name,
    async (arg, { rejectWithValue }) => {
      try {
        const endpoint = typeof url === "function" ? url(arg) : url;
        const response = await createAuthenticatedFetch(endpoint, {
          method: "PUT",
          body: JSON.stringify(arg),
        });
        return await response.json();
      } catch (error) {
        return rejectWithValue(handleAsyncThunkError(error));
      }
    }
  );
};

// Generic async thunk creator for DELETE requests
export const createDeleteThunk = <T>(
  name: string,
  url: string | ((arg: any) => string)
) => {
  return createAsyncThunk<T, any, { state: RootState }>(
    name,
    async (arg, { rejectWithValue }) => {
      try {
        const endpoint = typeof url === "function" ? url(arg) : url;
        const response = await createAuthenticatedFetch(endpoint, {
          method: "DELETE",
        });

        // DELETE requests might not return JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        }
        return {} as T;
      } catch (error) {
        return rejectWithValue(handleAsyncThunkError(error));
      }
    }
  );
};
