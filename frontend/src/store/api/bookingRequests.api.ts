import { baseApi } from "@/store/api/baseApi";
import type {
  BookingRequest,
  BookingRequestStatus,
} from "@/app/types/bookingRequest";

/** The API sometimes wraps the payload in `data` and sometimes does not. */
type MaybeWrapped<T> = T | { data: T };

const unwrap = <T,>(response: MaybeWrapped<T>): T =>
  response && typeof response === "object" && "data" in response
    ? (response as { data: T }).data
    : (response as T);

export interface CreateBookingRequestArgs {
  propertyId: string;
  email?: string;
  phone_number?: string;
  date_from?: string | null;
  date_to?: string | null;
  description?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The endpoint rejects empty strings and malformed dates, so blanks are dropped
 * rather than sent. This lived in the axios wrapper before and moves here with
 * the rest of the domain.
 */
const buildCreateBody = ({
  propertyId,
  email,
  phone_number,
  date_from,
  date_to,
  description,
}: CreateBookingRequestArgs) => ({
  property_id: propertyId,
  ...(email ? { email } : {}),
  ...(phone_number ? { phone_number } : {}),
  ...(date_from && ISO_DATE.test(date_from) ? { date_from } : {}),
  ...(date_to && ISO_DATE.test(date_to) ? { date_to } : {}),
  ...(description?.trim() ? { description: description.trim() } : {}),
});

export const bookingRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Every request, for the admin panel. */
    getBookingRequests: builder.query<BookingRequest[], string | void>({
      query: (status) => ({
        url: "/booking-requests",
        params: status ? { status } : undefined,
      }),
      transformResponse: unwrap<BookingRequest[]>,
      providesTags: [{ type: "BookingRequests", id: "LIST" }],
    }),

    /** The signed-in tenant's own requests, optionally for one property. */
    getMyBookingRequests: builder.query<BookingRequest[], string | void>({
      query: (propertyId) => ({
        url: "/booking-requests/me",
        params: propertyId ? { property_id: propertyId } : undefined,
      }),
      transformResponse: unwrap<BookingRequest[]>,
      providesTags: [{ type: "BookingRequests", id: "MINE" }],
    }),

    createBookingRequest: builder.mutation<
      BookingRequest,
      CreateBookingRequestArgs
    >({
      query: (args) => ({
        url: "/booking-requests",
        method: "POST",
        body: buildCreateBody(args),
      }),
      transformResponse: unwrap<BookingRequest>,
      invalidatesTags: [
        { type: "BookingRequests", id: "MINE" },
        { type: "BookingRequests", id: "LIST" },
      ],
    }),

    updateBookingRequestStatus: builder.mutation<
      BookingRequest,
      { id: string; status: BookingRequestStatus }
    >({
      query: ({ id, status }) => ({
        url: `/booking-requests/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: unwrap<BookingRequest>,
      // The list refetches itself instead of the panel patching its own copy.
      invalidatesTags: [{ type: "BookingRequests", id: "LIST" }],
    }),

    /**
     * Admin proposes a viewing slot (ISO timestamp). The backend accepts it
     * only at the viewing stages and clears any earlier tenant confirmation
     * when a new time replaces the old one.
     */
    proposeViewing: builder.mutation<
      BookingRequest,
      { id: string; proposed_viewing_at: string }
    >({
      query: ({ id, proposed_viewing_at }) => ({
        url: `/booking-requests/${id}/viewing`,
        method: "PATCH",
        body: { proposed_viewing_at },
      }),
      transformResponse: unwrap<BookingRequest>,
      invalidatesTags: [
        { type: "BookingRequests", id: "LIST" },
        { type: "BookingRequests", id: "MINE" },
      ],
    }),

    /** Tenant confirms the proposed slot on their own booking. */
    confirmViewing: builder.mutation<BookingRequest, string>({
      query: (id) => ({
        url: `/booking-requests/${id}/viewing/confirm`,
        method: "POST",
      }),
      transformResponse: unwrap<BookingRequest>,
      invalidatesTags: [
        { type: "BookingRequests", id: "LIST" },
        { type: "BookingRequests", id: "MINE" },
      ],
    }),
  }),
});

export const {
  useGetBookingRequestsQuery,
  useGetMyBookingRequestsQuery,
  useCreateBookingRequestMutation,
  useUpdateBookingRequestStatusMutation,
  useProposeViewingMutation,
  useConfirmViewingMutation,
} = bookingRequestsApi;
