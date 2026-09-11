"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  CalendarClock,
  CalendarRange,
  Check,
  ClipboardList,
  MapPin,
} from "lucide-react";
import { selectIsAuthenticated, selectUser } from "@/store/slices/authSlice";
import {
  useConfirmViewingMutation,
  useGetMyBookingRequestsQuery,
} from "@/store/api/bookingRequests.api";
import {
  BOOKING_STATUS_EXPLANATIONS,
  BOOKING_STATUS_LABELS,
  BookingRequest,
  BookingRequestStatus,
} from "@/app/types/bookingRequest";
import TenantUniversalHeader from "@/app/components/TenantUniversalHeader";
import Footer from "@/app/components/Footer";
import { waitForSessionManager } from "@/app/components/providers/SessionManager";

/** Badge palette per stage — the same hues the admin table uses. */
const STATUS_STYLES: Record<BookingRequestStatus, string> = {
  new: "bg-blue-50 text-blue-700 border border-blue-100",
  contacting: "bg-amber-50 text-amber-700 border border-amber-100",
  kyc_referencing: "bg-purple-50 text-purple-700 border border-purple-100",
  approved_viewing: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  viewing: "bg-cyan-50 text-cyan-700 border border-cyan-100",
  contract: "bg-slate-50 text-slate-700 border border-slate-200",
  deposit: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  full_payment: "bg-green-50 text-green-700 border border-green-100",
  move_in: "bg-teal-50 text-teal-700 border border-teal-100",
  rented: "bg-gray-900 text-white border border-gray-900",
  cancel_booking: "bg-rose-50 text-rose-700 border border-rose-100",
};

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSlot(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * One booking request, with the pipeline stage translated into plain
 * language and — when the operator proposed a viewing slot — the button
 * that confirms it (the action the "confirm in your account" email points
 * at).
 */
const RequestCard: React.FC<{
  request: BookingRequest;
  confirmingId: string | null;
  onConfirmViewing: (id: string) => void;
}> = ({ request, confirmingId, onConfirmViewing }) => {
  const propertyLabel =
    request.property?.title ||
    request.property?.apartment_number ||
    "Property";
  const slot = formatSlot(request.proposed_viewing_at);
  const from = formatDate(request.date_from);
  const to = formatDate(request.date_to);
  const submitted = formatDate(request.created_at);

  return (
    <div
      data-testid="my-request-card"
      className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href={`/app/properties/${request.property_id}`}
            className="text-lg font-semibold text-black hover:underline"
          >
            {propertyLabel}
          </Link>
          {request.property?.address ? (
            <div className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {request.property.address}
            </div>
          ) : null}
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            STATUS_STYLES[request.status]
          }`}
        >
          {BOOKING_STATUS_LABELS[request.status] ?? request.status}
        </span>
      </div>

      <p className="text-sm text-gray-700">
        {BOOKING_STATUS_EXPLANATIONS[request.status] ??
          `Your booking status is now "${request.status}".`}
      </p>

      {slot ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-black">
            <CalendarClock className="w-4 h-4 text-gray-500 shrink-0" />
            <span>
              Viewing proposed for <strong>{slot}</strong>
            </span>
          </div>
          {request.viewing_confirmed_at ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
              <Check className="w-3.5 h-3.5" />
              Confirmed
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onConfirmViewing(request.id)}
              disabled={confirmingId === request.id}
              data-testid="confirm-viewing"
              className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium cursor-pointer hover:bg-gray-800 disabled:opacity-50 disabled:cursor-default transition-colors"
            >
              {confirmingId === request.id
                ? "Confirming..."
                : "Confirm viewing"}
            </button>
          )}
        </div>
      ) : null}

      <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
        {from || to ? (
          <span className="flex items-center gap-1">
            <CalendarRange className="w-3.5 h-3.5" />
            {from ?? "—"} → {to ?? "—"}
          </span>
        ) : null}
        {submitted ? <span>Requested {submitted}</span> : null}
      </div>
    </div>
  );
};

export default function MyRequestsPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const { data, isLoading } = useGetMyBookingRequestsQuery(undefined, {
    skip: !sessionReady || !isAuthenticated,
  });
  const [confirmViewing] = useConfirmViewingMutation();

  const requests = data ?? [];

  useEffect(() => {
    const initializeSession = async () => {
      try {
        await waitForSessionManager();
      } catch (error) {
        console.error("Failed to initialize session:", error);
      } finally {
        setSessionReady(true);
      }
    };
    initializeSession();
  }, []);

  // Tenants (and admins checking the tenant view) only; others have no
  // booking requests of their own to show.
  useEffect(() => {
    if (!sessionReady) return;

    if (!isAuthenticated || !user) {
      router.push("/");
      return;
    }
    if (user.role !== "tenant" && user.role !== "admin") {
      router.push("/app/units");
    }
  }, [sessionReady, isAuthenticated, user, router]);

  const handleConfirmViewing = async (id: string) => {
    setConfirmError(null);
    try {
      setConfirmingId(id);
      await confirmViewing(id).unwrap();
    } catch (err: unknown) {
      const raw = (err as { data?: { message?: unknown } })?.data?.message;
      setConfirmError(
        (Array.isArray(raw) ? raw.join("; ") : (raw as string)) ||
          "Failed to confirm the viewing. Please try again.",
      );
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TenantUniversalHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black">My requests</h1>
          <p className="text-gray-600 mt-1">
            Every viewing request you have sent, with where it stands now.
          </p>
        </div>

        {confirmError ? (
          <p className="mb-4 text-sm text-red-600">{confirmError}</p>
        ) : null}

        {isLoading && !requests.length ? (
          <div className="flex items-center justify-center gap-2 py-16 text-black">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            <span>Loading your requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-black mb-1">
              No requests yet
            </h2>
            <p className="text-gray-600 mb-4">
              When you request a viewing on a property, it will appear here.
            </p>
            <Link
              href="/app/units"
              className="inline-block px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                confirmingId={confirmingId}
                onConfirmViewing={handleConfirmViewing}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
