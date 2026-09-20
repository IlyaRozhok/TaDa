import { baseApi } from "@/store/api/baseApi";
import type {
  CallRequest,
  CallRequestSource,
} from "@/app/types/callRequest";

/** The API sometimes wraps the payload in `data` and sometimes does not. */
type MaybeWrapped<T> = T | { data: T };

const unwrap = <T,>(response: MaybeWrapped<T>): T =>
  response && typeof response === "object" && "data" in response
    ? (response as { data: T }).data
    : (response as T);

export const callRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Every "Book a call" submission, for the admin panel. The public form
     * is the only writer of rows; admins only mark them handled below.
     */
    getCallRequests: builder.query<CallRequest[], CallRequestSource | void>({
      query: (source) => ({
        url: "/call-requests",
        params: source ? { source } : undefined,
      }),
      transformResponse: unwrap<CallRequest[]>,
      providesTags: [{ type: "CallRequests", id: "LIST" }],
    }),

    /**
     * Mark a request called back, or clear the mark. The server stamps
     * `handled_at` itself; invalidation refreshes the listing so two admins
     * working the same list see each other's calls.
     */
    setCallRequestHandled: builder.mutation<
      CallRequest,
      { id: string; handled: boolean }
    >({
      query: ({ id, handled }) => ({
        url: `/call-requests/${id}/handled`,
        method: "PATCH",
        body: { handled },
      }),
      transformResponse: unwrap<CallRequest>,
      invalidatesTags: [{ type: "CallRequests", id: "LIST" }],
    }),
  }),
});

export const { useGetCallRequestsQuery, useSetCallRequestHandledMutation } =
  callRequestsApi;
