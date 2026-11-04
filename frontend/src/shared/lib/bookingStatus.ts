import type { BookingRequestStatus } from "@/app/types/bookingRequest";

/**
 * The booking pipeline in order. Mirrors `PIPELINE` and `assertStatusTransition`
 * in the backend's booking-request.service.ts — change them together.
 */
const PIPELINE: BookingRequestStatus[] = [
  "new",
  "contacting",
  "kyc_referencing",
  "approved_viewing",
  "viewing",
  "contract",
  "deposit",
  "full_payment",
  "move_in",
  "rented",
];

const CANCELLED: BookingRequestStatus = "cancel_booking";

/**
 * The statuses a booking can hold next, its current one included: forward any
 * number of steps, back exactly one, cancel from any active stage. `rented` and
 * `cancel_booking` are terminal.
 */
export function allowedBookingStatuses(
  current: BookingRequestStatus,
): BookingRequestStatus[] {
  if (current === "rented" || current === CANCELLED) return [current];
  const index = PIPELINE.indexOf(current);
  return [...PIPELINE.slice(Math.max(index - 1, 0)), CANCELLED];
}
