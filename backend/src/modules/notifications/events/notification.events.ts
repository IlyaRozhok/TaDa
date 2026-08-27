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
  BookingStatusChanged: "booking-request.status-changed",
  ViewingProposed: "booking-request.viewing-proposed",
  ViewingConfirmed: "booking-request.viewing-confirmed",
  DemoRequested: "demo.requested",
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
    /**
     * Contact phone the tenant typed into the booking form, not the one on
     * their profile. The support inbox calls this number, so it carries the
     * real value rather than a "provided: yes" flag — the recipient is a fixed
     * internal address, never the tenant.
     */
    phone: string | null;
  };
  dateFrom: string | null;
  dateTo: string | null;
  message: string | null;
}

/**
 * A booking moved through the pipeline. Carries IDs and display fields only:
 * recipient addresses are resolved from the database by the notification
 * service (invariant 2 — no event payload can redirect an email).
 */
export interface BookingStatusChangedEvent {
  bookingId: string;
  propertyId: string;
  tenantId: string;
  from: string;
  to: string;
  property: {
    title: string | null;
    address: string | null;
  };
}

/** An admin proposed a viewing slot to the tenant. */
export interface ViewingProposedEvent {
  bookingId: string;
  propertyId: string;
  tenantId: string;
  /** ISO datetime of the proposed viewing. */
  proposedAt: string;
  property: {
    title: string | null;
    address: string | null;
  };
}

/** The tenant confirmed the proposed viewing slot. */
export interface ViewingConfirmedEvent {
  bookingId: string;
  propertyId: string;
  tenantId: string;
  /** ISO datetime of the confirmed viewing. */
  proposedAt: string;
  confirmedAt: string;
  property: {
    title: string | null;
    address: string | null;
  };
}

/**
 * A demo request from the public landing form. Unauthenticated by nature —
 * the sender is whoever filled in the form, so every field is untrusted input
 * that the DTO has already length-capped and validated. The recipient is the
 * internal inbox, never anything from this payload (invariant 2 of
 * NotificationsService).
 */
export interface DemoRequestedEvent {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Which flavour of the landing sent it: "Operator", "Tenant" or "Website". */
  source: string;
  requestedAt: Date;
}
