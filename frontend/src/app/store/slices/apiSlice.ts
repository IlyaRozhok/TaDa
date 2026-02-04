import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["User", "Property", "Preferences", "Shortlist"],
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
    getProfile: builder.query({
      query: () => "/users/profile",
      providesTags: ["User"],
    }),

    // Properties endpoints
    getProperties: builder.query({
      query: (filters) => ({
        url: "/properties",
        params: filters,
      }),
      providesTags: ["Property"],
    }),
    getProperty: builder.query({
      query: (id) => `/properties/${id}`,
      providesTags: ["Property"],
    }),
    createProperty: builder.mutation({
      query: (formData) => ({
        url: "/properties",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Property"],
    }),

    // Matching endpoints
    getMatches: builder.query({
      query: (criteria) => ({
        url: "/matching/matches",
        params: criteria,
      }),
    }),
    getRecommendations: builder.query({
      query: () => "/matching/recommendations",
    }),
    addToShortlist: builder.mutation({
      query: (propertyId) => ({
        url: `/shortlist/${propertyId}`,
        method: "POST",
      }),
      invalidatesTags: ["Shortlist"],
    }),
    removeFromShortlist: builder.mutation({
      query: (propertyId) => ({
        url: `/shortlist/${propertyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shortlist"],
    }),
    getShortlist: builder.query({
      query: () => "/shortlist",
      providesTags: ["Shortlist"],
    }),

    // Preferences endpoints
    getPreferences: builder.query({
      query: () => "/preferences",
      providesTags: ["Preferences"],
    }),
    createPreferences: builder.mutation({
      query: (data) => ({
        url: "/preferences",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Preferences"],
    }),
    updatePreferences: builder.mutation({
      query: (data) => ({
        url: "/preferences",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Preferences"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useCreatePropertyMutation,
  useGetMatchesQuery,
  useGetRecommendationsQuery,
  useAddToShortlistMutation,
  useRemoveFromShortlistMutation,
  useGetShortlistQuery,
  useGetPreferencesQuery,
  useCreatePreferencesMutation,
  useUpdatePreferencesMutation,
} = apiSlice;
