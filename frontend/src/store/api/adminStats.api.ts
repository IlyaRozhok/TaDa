import { baseApi } from "@/store/api/baseApi";
import type { AdminStats, AdminStatsRange } from "@/app/types/adminStats";

export const adminStatsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** The admin Statistics page bundle, scoped to a signup-date range. */
    getAdminStats: builder.query<AdminStats, AdminStatsRange>({
      query: ({ from, to }) => ({
        url: "/admin/stats",
        params: {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      }),
    }),
  }),
});

export const { useGetAdminStatsQuery } = adminStatsApi;
