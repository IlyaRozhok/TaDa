import { baseApi } from "@/store/api/baseApi";
import type { TenantCvResponse } from "@/app/types/tenantCv";

/** The API sometimes wraps the payload in `data` and sometimes does not. */
type MaybeWrapped<T> = T | { data: T };

const unwrap = <T,>(response: MaybeWrapped<T>): T =>
  response && typeof response === "object" && "data" in response
    ? (response as { data: T }).data
    : (response as T);

export const tenantCvApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** The signed-in tenant's own CV. */
    getTenantCv: builder.query<TenantCvResponse, void>({
      query: () => "/tenant-cv/current",
      transformResponse: unwrap<TenantCvResponse>,
      providesTags: [{ type: "TenantCv", id: "ME" }],
    }),

    /** A CV opened through a share link. No session required. */
    getPublicTenantCv: builder.query<TenantCvResponse, string>({
      query: (shareUuid) => `/tenant-cv/${shareUuid}`,
      transformResponse: unwrap<TenantCvResponse>,
      providesTags: (_result, _error, shareUuid) => [
        { type: "TenantCv", id: shareUuid },
      ],
    }),

    /**
     * Creates the share link. Invalidating the CV is what makes `share_uuid`
     * appear on screen — previously the page patched its own local copy.
     */
    createTenantCvShare: builder.mutation<{ share_uuid: string }, void>({
      query: () => ({ url: "/tenant-cv/share", method: "POST" }),
      transformResponse: unwrap<{ share_uuid: string }>,
      invalidatesTags: [{ type: "TenantCv", id: "ME" }],
    }),
  }),
});

export const {
  useGetTenantCvQuery,
  useGetPublicTenantCvQuery,
  useCreateTenantCvShareMutation,
} = tenantCvApi;
