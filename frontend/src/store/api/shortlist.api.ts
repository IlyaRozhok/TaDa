import { baseApi } from "@/store/api/baseApi";
import type { Property } from "@/app/types";

/** The API sometimes wraps the payload in `data` and sometimes does not. */
type MaybeWrapped<T> = T | { data: T };

const unwrap = <T,>(response: MaybeWrapped<T>): T =>
  response && typeof response === "object" && "data" in response
    ? (response as { data: T }).data
    : (response as T);

export interface AddToShortlistArgs {
  propertyId: string;
  /** Painted into the cached list before the request answers. */
  property: Property;
}

export const shortlistApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Every property the signed-in tenant or admin has hearted. */
    getShortlist: builder.query<Property[], void>({
      query: () => "/shortlist",
      transformResponse: unwrap<Property[]>,
      providesTags: [{ type: "Shortlist", id: "LIST" }],
    }),

    /**
     * The heart lives on catalogue cards, so it has to fill in on click. That
     * rules out invalidation — it would refetch the whole list on every toggle
     * and the heart would only change once the round trip came back. The cached
     * list is patched instead, and the patch is rolled back if the call fails.
     */
    addToShortlist: builder.mutation<void, AddToShortlistArgs>({
      query: ({ propertyId }) => ({
        url: `/shortlist/${propertyId}`,
        method: "POST",
      }),
      async onQueryStarted(
        { propertyId, property },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          shortlistApi.util.updateQueryData(
            "getShortlist",
            undefined,
            (draft) => {
              if (!draft.some((item) => item.id === propertyId)) {
                draft.push(property);
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    /** Optimistic for the same reason as `addToShortlist`. */
    removeFromShortlist: builder.mutation<void, string>({
      query: (propertyId) => ({
        url: `/shortlist/${propertyId}`,
        method: "DELETE",
      }),
      async onQueryStarted(propertyId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          shortlistApi.util.updateQueryData(
            "getShortlist",
            undefined,
            (draft) => {
              const index = draft.findIndex((item) => item.id === propertyId);
              if (index !== -1) {
                draft.splice(index, 1);
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    /**
     * Wiping the whole list is rare and confirmed by a modal, so it invalidates
     * rather than patches — the refetch is what proves the server agrees.
     */
    clearShortlist: builder.mutation<void, void>({
      query: () => ({ url: "/shortlist", method: "DELETE" }),
      invalidatesTags: [{ type: "Shortlist", id: "LIST" }],
    }),
  }),
});

export const {
  useGetShortlistQuery,
  useAddToShortlistMutation,
  useRemoveFromShortlistMutation,
  useClearShortlistMutation,
} = shortlistApi;
