import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  credentials: "include",
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["User", "Property", "Preferences", "Shortlist"],
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  // Keep all server state cached for 5 minutes by default
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({
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
    getPublicProperty: builder.query({
      query: (id) => `/properties/public/${id}`,
      providesTags: ["Property"],
    }),
    getPublicBuilding: builder.query({
      query: (id) => `/buildings/public/${id}`,
      providesTags: ["Property"],
    }),
    getPublicBuildingProperties: builder.query<
      any,
      { building_id: string }
    >({
      query: ({ building_id }) => ({
        url: "/properties/public/all",
        params: { building_id },
      }),
      providesTags: ["Property"],
      keepUnusedDataFor: 300,
    }),
    getPublicPropertiesPaginated: builder.query<
      any,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 12, search } = {}) => ({
        url: "/properties/public",
        params: { page, limit, search },
      }),
      providesTags: ["Property"],
      keepUnusedDataFor: 300,
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
    getMatchedPropertiesPaginated: builder.query<
      any,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 12, search } = {}) => ({
        url: "/matching/matched-properties",
        params: { page, limit, search },
      }),
      providesTags: ["Property"],
      // Keep matched properties cached a bit longer for smoother navigation
      keepUnusedDataFor: 300,
    }),
    getRecommendations: builder.query({
      query: () => "/matching/recommendations",
    }),
    getPropertyMatch: builder.query<any, string>({
      query: (propertyId) => `/matching/property/${propertyId}`,
      providesTags: ["Property"],
      keepUnusedDataFor: 300,
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

    // Tenant CV (current user's CV)
    getTenantCv: builder.query({
      query: () => "/tenant-cv/current",
      // Tie CV to User tag so it can be invalidated together if needed
      providesTags: ["User"],
    }),

    // Admin: get tenant CV by userId
    getAdminTenantCv: builder.query<{ share_uuid?: string | null }, string>({
      query: (userId) => `/tenant-cv/admin/${userId}`,
    }),
    /** Same auth as getTenantCv (Redux token) — avoids axios/localStorage mismatch breaking share */
    createTenantCvShare: builder.mutation<
      { share_uuid: string } | { data?: { share_uuid?: string } },
      void
    >({
      query: () => ({
        url: "/tenant-cv/share",
        method: "POST",
      }),
    }),

    // Booking requests (admin)
    getBookingRequests: builder.query({
      query: (status?: string) => ({
        url: "/booking-requests",
        params: status ? { status } : undefined,
      }),
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
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetPublicPropertyQuery,
  useGetPublicBuildingQuery,
  useGetPublicBuildingPropertiesQuery,
  useGetPublicPropertiesPaginatedQuery,
  useCreatePropertyMutation,
  useGetMatchedPropertiesPaginatedQuery,
  useGetRecommendationsQuery,
  useGetPropertyMatchQuery,
  useAddToShortlistMutation,
  useRemoveFromShortlistMutation,
  useGetShortlistQuery,
  useGetTenantCvQuery,
  useGetAdminTenantCvQuery,
  useCreateTenantCvShareMutation,
  useGetBookingRequestsQuery,
  useGetPreferencesQuery,
  useCreatePreferencesMutation,
  useUpdatePreferencesMutation,
} = apiSlice;
