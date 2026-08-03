import { baseApi } from "@/store/api/baseApi";

/**
 * Endpoints that have not been split into their own domain file yet. They are
 * injected into the same baseApi, so the store wiring is unchanged; step 5.1
 * moves them out one domain per PR — see store/api/tenantCv.api.ts for the
 * shape they are heading towards.
 */
export const apiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  useGetProfileQuery,
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
  useGetPreferencesQuery,
  useCreatePreferencesMutation,
  useUpdatePreferencesMutation,
} = apiSlice;
