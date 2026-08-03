import { baseApi } from "@/store/api/baseApi";

/**
 * What the buildings routes actually answer with — the entity as the API
 * serialises it, unwrapped (these endpoints do not use the `data` envelope).
 * Six components declare their own narrower `Building`; folding them into one
 * tree is step 5.2, so this stays next to the endpoints that produce it.
 */
export interface Building {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  number_of_units: number | null;
  type_of_unit: string[];
  logo: string | null;
  video: string | null;
  photos: string[];
  documents: string | null;
  metro_stations: { label: string; destination: number }[];
  areas: string[];
  districts: string[];
  amenities: string[];
  pet_policy: boolean;
  pets:
    | {
        type: "dog" | "cat" | "other";
        customType?: string;
        size?: "small" | "medium" | "large";
      }[]
    | null;
  tenant_type: string[];
  family_status: string[];
  occupation: string[];
  children: string[];
  operator_id: string | null;
  created_at: string;
  updated_at: string;
}

/** The admin list takes an optional operator filter. */
export interface GetBuildingsArgs {
  operator_id?: string;
}

export const buildingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Admin list, also the source for the building dropdowns in the property modals. */
    getBuildings: builder.query<Building[], GetBuildingsArgs | void>({
      query: (args) => ({
        url: "/buildings",
        params: args?.operator_id ? { operator_id: args.operator_id } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Building" as const, id })),
              { type: "Building" as const, id: "LIST" },
            ]
          : [{ type: "Building" as const, id: "LIST" }],
    }),

    getBuilding: builder.query<Building, string>({
      query: (id) => `/buildings/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Building", id }],
    }),

    /**
     * The building behind a property, on pages a signed-out visitor can open.
     * Listed in the base query's public endpoints so a 401 here could never
     * sign a reader out.
     */
    getPublicBuilding: builder.query<Building, string>({
      query: (id) => `/buildings/public/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Building", id }],
    }),

    createBuilding: builder.mutation<Building, Partial<Building>>({
      query: (body) => ({ url: "/buildings", method: "POST", body }),
      invalidatesTags: [{ type: "Building", id: "LIST" }],
    }),

    updateBuilding: builder.mutation<
      Building,
      { id: string; data: Partial<Building> }
    >({
      query: ({ id, data }) => ({
        url: `/buildings/${id}`,
        method: "PATCH",
        body: data,
      }),
      // Both the row in the list and the detail behind it are stale now.
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Building", id },
        { type: "Building", id: "LIST" },
      ],
    }),

    deleteBuilding: builder.mutation<{ message?: string }, string>({
      query: (id) => ({ url: `/buildings/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Building", id: "LIST" }],
    }),
  }),
});

export const {
  useGetBuildingsQuery,
  useLazyGetBuildingQuery,
  useGetPublicBuildingQuery,
  useCreateBuildingMutation,
  useUpdateBuildingMutation,
  useDeleteBuildingMutation,
} = buildingsApi;
