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
     * Every "Book a call" submission, for the admin panel. Read-only: the
     * public form is the only writer, and it posts without a session.
     */
    getCallRequests: builder.query<CallRequest[], CallRequestSource | void>({
      query: (source) => ({
        url: "/call-requests",
        params: source ? { source } : undefined,
      }),
      transformResponse: unwrap<CallRequest[]>,
      providesTags: [{ type: "CallRequests", id: "LIST" }],
    }),
  }),
});

export const { useGetCallRequestsQuery } = callRequestsApi;
