import { baseApi } from "@/store/api/baseApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Property } from "@/app/types";

/**
 * Envelope of the public properties routes: both `/properties/public` and
 * `/properties/public/all` answer with the same paginated shape (the backend
 * serves them from one service method, default limit 12, max 100).
 */
export interface PublicPropertiesPage {
  data: Property[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetPublicPropertiesArgs {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetPublicPropertiesAllArgs {
  building_id?: string;
}

const listTags = (result: PublicPropertiesPage | undefined) =>
  result
    ? [
        ...result.data.map(({ id }) => ({ type: "Property" as const, id })),
        { type: "Property" as const, id: "PUBLIC_LIST" },
      ]
    : [{ type: "Property" as const, id: "PUBLIC_LIST" }];

/**
 * Public read endpoints of the properties domain — everything a signed-out
 * visitor can open. All of them are listed in the base query's public
 * endpoints, so a stray 401 can never sign a reader out. The authorised
 * CRUD, matching and upload layers migrate in their own PRs (step 5.1).
 */
export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Paginated public catalogue, `GET /properties/public`. */
    getPublicProperties: builder.query<
      PublicPropertiesPage,
      GetPublicPropertiesArgs | void
    >({
      query: (args) => ({
        url: "/properties/public",
        params: {
          page: args?.page ?? 1,
          limit: args?.limit ?? 12,
          ...(args?.search ? { search: args.search } : {}),
        },
      }),
      providesTags: listTags,
    }),

    /**
     * `GET /properties/public/all`, optionally scoped to one building.
     * Despite the name it is paginated too — callers without params get the
     * newest 12, which is the behaviour the sections have always had.
     */
    getPublicPropertiesAll: builder.query<
      PublicPropertiesPage,
      GetPublicPropertiesAllArgs | void
    >({
      query: (args) => ({
        url: "/properties/public/all",
        params: args?.building_id
          ? { building_id: args.building_id }
          : undefined,
      }),
      providesTags: listTags,
    }),

    /** One public property, `GET /properties/public/:id` — a bare object. */
    getPublicProperty: builder.query<Property, string>({
      query: (id) => `/properties/public/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Property", id }],
    }),

    /**
     * Every page of the public catalogue concatenated (limit 100 per request,
     * the API max) — for browse views that filter and sort client-side, e.g.
     * the map. The page loop lives here so consumers get one cached list.
     */
    getAllPublicPropertiesForBrowse: builder.query<Property[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const all: Property[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const result = await fetchWithBQ({
            url: "/properties/public/all",
            params: { page, limit: 100 },
          });
          if (result.error) {
            return { error: result.error as FetchBaseQueryError };
          }
          const body = result.data as PublicPropertiesPage;
          all.push(...(body.data ?? []));
          totalPages = body.totalPages ?? 1;
          page += 1;
        } while (page <= totalPages);
        return { data: all };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Property" as const, id })),
              { type: "Property" as const, id: "PUBLIC_LIST" },
            ]
          : [{ type: "Property" as const, id: "PUBLIC_LIST" }],
    }),
  }),
});

export const {
  useGetPublicPropertiesQuery,
  useGetPublicPropertiesAllQuery,
  useGetPublicPropertyQuery,
  useGetAllPublicPropertiesForBrowseQuery,
} = propertiesApi;
