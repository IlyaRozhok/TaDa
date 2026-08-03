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
  }),
});

export const { useGetPropertiesQuery } = apiSlice;
