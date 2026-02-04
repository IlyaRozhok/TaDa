import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store/store";

// Helper to get token from state
export const getTokenFromState = (state: RootState): string | null => {
  return state.auth.accessToken;
};

// Helper to create headers with auth token
export const createAuthHeaders = (token: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

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

// Helper to create authenticated fetch request
export const createAuthenticatedFetch = async (
  url: string,
  options: RequestInit = {},
  token: string | null
): Promise<Response> => {
  const headers = createAuthHeaders(token);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
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
    async (arg, { getState, rejectWithValue }) => {
      try {
        const token = getTokenFromState(getState());
        const endpoint = typeof url === "function" ? url(arg) : url;
        const response = await createAuthenticatedFetch(endpoint, {}, token);
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
    async (arg, { getState, rejectWithValue }) => {
      try {
        const token = getTokenFromState(getState());
        const endpoint = typeof url === "function" ? url(arg) : url;
        const response = await createAuthenticatedFetch(
          endpoint,
          {
            method: "POST",
            body: JSON.stringify(arg),
          },
          token
        );
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
    async (arg, { getState, rejectWithValue }) => {
      try {
        const token = getTokenFromState(getState());
        const endpoint = typeof url === "function" ? url(arg) : url;
        const response = await createAuthenticatedFetch(
          endpoint,
          {
            method: "PUT",
            body: JSON.stringify(arg),
          },
          token
        );
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
    async (arg, { getState, rejectWithValue }) => {
      try {
        const token = getTokenFromState(getState());
        const endpoint = typeof url === "function" ? url(arg) : url;
        const response = await createAuthenticatedFetch(
          endpoint,
          { method: "DELETE" },
          token
        );
        
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