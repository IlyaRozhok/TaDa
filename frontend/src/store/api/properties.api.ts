import { baseApi } from "@/store/api/baseApi";
import { Property } from "@/app/types/property";

/**
 * What the wire may deliver where the Property type promises numbers and
 * arrays: TypeORM returns decimal columns as strings on the entity routes,
 * and nullable array columns may come back null.
 */
type WireProperty = Omit<
  Property,
  "price" | "deposit" | "square_meters" | "photos"
> & {
  price?: number | string | null;
  deposit?: number | string | null;
  square_meters?: number | string | null;
  photos?: string[] | null;
};

const toNumberOrNull = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isNaN(parsed) ? null : parsed;
};

/** One place turns the wire payload into the Property the type declares. */
export const normalizeProperty = (raw: WireProperty): Property => ({
  ...raw,
  price: toNumberOrNull(raw.price),
  deposit: toNumberOrNull(raw.deposit),
  square_meters: toNumberOrNull(raw.square_meters),
  photos: raw.photos ?? [],
});

interface WirePropertiesPage {
  data: WireProperty[];
  total: number;
  page: number;
  totalPages: number;
}

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

const normalizePage = (page: WirePropertiesPage): PublicPropertiesPage => ({
  ...page,
  data: page.data.map(normalizeProperty),
});

export interface GetPublicPropertiesArgs {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetPublicPropertiesAllArgs {
  building_id?: string;
}

/** Rows per page in the admin properties table. */
export const ADMIN_PAGE_SIZE = 20;

/**
 * Envelope of the admin list, `GET /properties`. Same shape as the public
 * one plus `limit` — the page size the server actually applied, which the
 * table's numbered control renders off.
 */
export interface AdminPropertiesPage extends PublicPropertiesPage {
  limit: number;
}

/**
 * Query of the admin list. Search and every filter are applied server-side,
 * and they combine: sending a search term and a filter narrows to both.
 *
 * Bed and bath counts come in two flavours, matching the table's buckets:
 * `bedrooms` is the closed bucket (Studio / 1 / 2 / 3), `bedrooms_min` the
 * open-ended one (4+).
 */
export interface GetPropertiesArgs {
  page?: number;
  limit?: number;
  search?: string;
  building_id?: string;
  operator_id?: string;
  is_landing_listing?: boolean;
  property_type?: string;
  bedrooms?: number;
  bedrooms_min?: number;
  bathrooms?: number;
  bathrooms_min?: number;
}

/** Drops the keys the caller left unset so they never reach the query string. */
const adminListParams = (args?: GetPropertiesArgs): Record<string, string> => {
  const params: Record<string, string> = {
    page: String(args?.page ?? 1),
    limit: String(args?.limit ?? ADMIN_PAGE_SIZE),
  };

  if (args?.search) params.search = args.search;
  if (args?.building_id) params.building_id = args.building_id;
  if (args?.operator_id) params.operator_id = args.operator_id;
  if (args?.is_landing_listing !== undefined) {
    params.is_landing_listing = String(args.is_landing_listing);
  }
  if (args?.property_type) params.property_type = args.property_type;
  if (args?.bedrooms !== undefined) params.bedrooms = String(args.bedrooms);
  if (args?.bedrooms_min !== undefined) {
    params.bedrooms_min = String(args.bedrooms_min);
  }
  if (args?.bathrooms !== undefined) params.bathrooms = String(args.bathrooms);
  if (args?.bathrooms_min !== undefined) {
    params.bathrooms_min = String(args.bathrooms_min);
  }

  return params;
};

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
      transformResponse: normalizePage,
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
      transformResponse: normalizePage,
      providesTags: listTags,
    }),

    /**
     * `GET /properties/public/landing` — the listings the landings feature to
     * signed-out visitors. A bare array, newest first, capped at six by the
     * backend.
     */
    getLandingListings: builder.query<Property[], void>({
      query: () => "/properties/public/landing",
      transformResponse: (raw: WireProperty[]) => raw.map(normalizeProperty),
      providesTags: [{ type: "Property", id: "LANDING_LIST" }],
    }),

    /** One public property, `GET /properties/public/:id` — a bare object. */
    getPublicProperty: builder.query<Property, string>({
      query: (id) => `/properties/public/${id}`,
      transformResponse: normalizeProperty,
      providesTags: (_result, _error, id) => [{ type: "Property", id }],
    }),

    /**
     * Admin list, `GET /properties` — one page at a time, with search and
     * filters resolved server-side. Answers with the pagination envelope.
     */
    getProperties: builder.query<AdminPropertiesPage, GetPropertiesArgs | void>({
      query: (args) => ({
        url: "/properties",
        params: adminListParams(args ?? undefined),
      }),
      transformResponse: (
        page: WirePropertiesPage & { limit: number },
      ): AdminPropertiesPage => ({
        ...page,
        data: page.data.map(normalizeProperty),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Property" as const,
                id,
              })),
              { type: "Property" as const, id: "LIST" },
            ]
          : [{ type: "Property" as const, id: "LIST" }],
    }),

    createProperty: builder.mutation<Property, Record<string, unknown>>({
      query: (body) => ({ url: "/properties", method: "POST", body }),
      transformResponse: normalizeProperty,
      invalidatesTags: [
        { type: "Property", id: "LIST" },
        { type: "Property", id: "PUBLIC_LIST" },
        { type: "Property", id: "MATCHED_LIST" },
        { type: "Property", id: "LANDING_LIST" },
      ],
    }),

    updateProperty: builder.mutation<
      Property,
      { id: string; data: Record<string, unknown> }
    >({
      query: ({ id, data }) => ({
        url: `/properties/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: normalizeProperty,
      // The row, the admin list and both public/matched lists are stale now.
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Property", id },
        { type: "Property", id: "LIST" },
        { type: "Property", id: "PUBLIC_LIST" },
        { type: "Property", id: "MATCHED_LIST" },
        { type: "Property", id: "LANDING_LIST" },
      ],
    }),

    deleteProperty: builder.mutation<void, string>({
      query: (id) => ({ url: `/properties/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Property", id: "LIST" },
        { type: "Property", id: "PUBLIC_LIST" },
        { type: "Property", id: "MATCHED_LIST" },
        { type: "Property", id: "LANDING_LIST" },
      ],
    }),
  }),
});

export const {
  useGetPublicPropertiesQuery,
  useGetPublicPropertiesAllQuery,
  useGetPublicPropertyQuery,
  useGetLandingListingsQuery,
  useGetPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
} = propertiesApi;
