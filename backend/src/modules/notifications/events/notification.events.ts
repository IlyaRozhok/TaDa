/**
 * Domain events the notification service listens to.
 *
 * The producers (auth, users, booking requests) know nothing about email: they
 * announce that something happened and return. That decoupling is the point —
 * a notification failure can never travel back up into the request that caused
 * it, because there is no call to fail.
 */
export const NotificationEvents = {
  UserRegistered: "user.registered",
  TenantCvCompleted: "tenant-cv.completed",
  BookingRequested: "booking-request.created",
} as const;

/** How the account came into existence. Both paths notify support. */
export type RegistrationSource = "google_oauth" | "admin_created";

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  source: RegistrationSource;
}

export interface TenantCvCompletedEvent {
  userId: string;
  email: string;
  name: string | null;
}

export interface BookingRequestedEvent {
  bookingId: string;
  /**
   * False when the row already existed and the tenant re-submitted the form.
   * The @Unique(tenant_id, property_id) constraint turns a second request for
   * the same property into an update, so this is the only thing that separates
   * the two — and the resubmit notification is behind its own config flag.
   */
  isFirstRequest: boolean;
  /**
   * Bumps the dedupe key on a resubmit. Without it every resubmit would collide
   * with the first request's key and be swallowed as a duplicate.
   */
  revision: string;
  property: {
    id: string;
    title: string | null;
    address: string | null;
  };
  tenant: {
    id: string;
    name: string | null;
    email: string | null;
  };
  dateFrom: string | null;
  dateTo: string | null;
  phoneProvided: boolean;
  emailProvided: boolean;
  descriptionProvided: boolean;
  message: string | null;
}
