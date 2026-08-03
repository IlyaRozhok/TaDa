import { baseApi } from "@/store/api/baseApi";

/**
 * Endpoints that have not been split into their own domain file yet. They are
 * injected into the same baseApi, so the store wiring is unchanged; step 5.1
 * moves them out one domain per PR — see store/api/tenantCv.api.ts for the
 * shape they are heading towards.
 */
export const apiSlice = baseApi.injectEndpoints({
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
  }),
});

export const {
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useCreatePropertyMutation,
  useGetMatchedPropertiesPaginatedQuery,
  useGetRecommendationsQuery,
  useGetPropertyMatchQuery,
} = apiSlice;
