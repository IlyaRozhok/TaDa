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

    /** One public property, `GET /properties/public/:id` — a bare object. */
    getPublicProperty: builder.query<Property, string>({
      query: (id) => `/properties/public/${id}`,
      transformResponse: normalizeProperty,
      providesTags: (_result, _error, id) => [{ type: "Property", id }],
    }),

    /** Admin list, `GET /properties` — the API answers with a bare array. */
    getProperties: builder.query<Property[], void>({
      query: () => "/properties",
      transformResponse: (raw: WireProperty[]) => raw.map(normalizeProperty),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Property" as const, id })),
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
      ],
    }),

    deleteProperty: builder.mutation<void, string>({
      query: (id) => ({ url: `/properties/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Property", id: "LIST" },
        { type: "Property", id: "PUBLIC_LIST" },
        { type: "Property", id: "MATCHED_LIST" },
      ],
    }),
  }),
});

export const {
  useGetPublicPropertiesQuery,
  useGetPublicPropertiesAllQuery,
  useGetPublicPropertyQuery,
  useGetPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
} = propertiesApi;
