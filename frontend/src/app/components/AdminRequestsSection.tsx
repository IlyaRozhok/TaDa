import React, { useState } from "react";
import {
  CalendarClock,
  CalendarRange,
  Check,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { BookingRequest, BookingRequestStatus } from "../types/bookingRequest";

function formatRequestDate(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusOptions: { value: BookingRequestStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacting", label: "Contacting" },
  { value: "kyc_referencing", label: "KYC / Referencing" },
  { value: "approved_viewing", label: "Approved viewing" },
  { value: "viewing", label: "Viewing" },
  { value: "contract", label: "Contract" },
  { value: "deposit", label: "Deposit" },
  { value: "full_payment", label: "Full payment" },
  { value: "move_in", label: "Move in" },
  { value: "rented", label: "Rented" },
  { value: "cancel_booking", label: "Cancel booking" },
];

const statusStyles: Record<BookingRequestStatus, string> = {
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

/** The stages at which the backend accepts a proposed viewing slot. */
const VIEWING_STAGES: BookingRequestStatus[] = [
  "approved_viewing",
  "viewing",
];

/**
 * The stages an operator drives themselves (mirrors the backend's
 * BOOKING_OPERATOR_STAGES). From `contract` onward the TA-DA! team runs the
 * deal, so the operator panel shows the status but offers no control.
 */
const OPERATOR_STAGES: BookingRequestStatus[] = [
  "new",
  "contacting",
  "kyc_referencing",
  "approved_viewing",
  "viewing",
];

function formatViewingSlot(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AdminRequestsSectionProps {
  requests: BookingRequest[];
  isLoading?: boolean;
  updatingId?: string | null;
  onUpdateStatus: (id: string, status: BookingRequestStatus) => void;
  /** "" is every status; otherwise a status value sent as `?status=`. */
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  /** Propose (or re-propose) a viewing slot; the value is an ISO timestamp. */
  onProposeViewing: (id: string, proposedAtIso: string) => void;
  onRefresh?: () => void;
  /**
   * Operator panel mode: the status select offers only the early stages
   * (plus cancel), and bookings past them are read-only — matching what the
   * backend lets an operator do.
   */
  operatorView?: boolean;
  /** Section heading; worded differently on the operator panel. */
  subtitle?: string;
}

/**
 * The per-row viewing cell: the proposed slot with its confirmation state,
 * and — at the viewing stages — a picker to propose or replace the slot.
 */
const ViewingCell: React.FC<{
  request: BookingRequest;
  disabled: boolean;
  onPropose: (id: string, proposedAtIso: string) => void;
}> = ({ request, disabled, onPropose }) => {
  const [slot, setSlot] = useState("");

  const proposed = formatViewingSlot(request.proposed_viewing_at);
  const canPropose = VIEWING_STAGES.includes(request.status);

  return (
    <div className="flex flex-col gap-1.5 text-sm min-w-[190px]">
      {proposed ? (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <CalendarClock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="text-black">{proposed}</span>
          {request.viewing_confirmed_at ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
              <Check className="w-3 h-3" />
              Confirmed
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
              Awaiting tenant
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs text-gray-400">
          {canPropose ? "No slot proposed" : "—"}
        </span>
      )}
      {canPropose && (
        <div className="flex items-center gap-1.5">
          <input
            type="datetime-local"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            disabled={disabled}
            data-testid="admin-viewing-slot"
            className="text-xs text-gray-900 bg-white border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => {
              if (!slot) return;
              onPropose(request.id, new Date(slot).toISOString());
              setSlot("");
            }}
            disabled={disabled || !slot}
            data-testid="admin-viewing-propose"
            className="px-2 py-1 rounded-md border border-gray-300 text-xs font-medium text-black cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors whitespace-nowrap"
          >
            {proposed ? "Re-propose" : "Propose"}
          </button>
        </div>
      )}
    </div>
  );
};

export const AdminRequestsSection: React.FC<AdminRequestsSectionProps> = ({
  requests,
  isLoading,
  updatingId,
  onUpdateStatus,
  statusFilter,
  onStatusFilterChange,
  onProposeViewing,
  operatorView = false,
  subtitle = "Track booking requests, form contact details, preferred dates, and statuses",
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-2xl font-semibold text-black">
            Booking requests
          </h3>
          <p className="text-black">{subtitle}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-black">
          Status
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            data-testid="admin-requests-status-filter"
            className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider min-w-[180px]">
                  Contact (form)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider whitespace-nowrap">
                  Stay (form)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Viewing
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider whitespace-nowrap">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center space-x-2 text-black">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                      <span>Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-black">
                      <CalendarClock className="w-12 h-12 text-black mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {statusFilter
                          ? "No requests at this status"
                          : "No booking requests yet"}
                      </h3>
                      <p>
                        {statusFilter
                          ? "Try a different status, or clear the filter."
                          : "New tenant booking requests will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  const tenantLabel =
                    request.tenant?.full_name ||
                    request.tenant?.email ||
                    "Unknown tenant";
                  const propertyLabel =
                    request.property?.apartment_number ||
                    request.property?.title ||
                    "Unknown property";

                  return (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-black">
                          {propertyLabel}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {request.property?.address || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium text-black flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            {tenantLabel}
                            {request.tenant?.tenantCv?.share_uuid ? (
                              <a
                                href={`/cv/${request.tenant.tenantCv.share_uuid}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-black underline hover:text-gray-500"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View CV
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500">
                                No CV link
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {request.tenant?.email || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1.5 text-sm">
                          {request.email ? (
                            <div className="flex items-start gap-2 text-black">
                              <Mail className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                              <span className="break-all">{request.email}</span>
                            </div>
                          ) : null}
                          {request.phone_number ? (
                            <div className="flex items-center gap-2 text-black">
                              <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                              <span>{request.phone_number}</span>
                            </div>
                          ) : null}
                          {!request.email && !request.phone_number ? (
                            <span className="text-xs text-gray-400">
                              Not provided
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-gray-800">
                        <div className="flex items-start gap-2">
                          <CalendarRange className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                          <div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">
                                From
                              </span>{" "}
                              {formatRequestDate(request.date_from)}
                            </div>
                            <div className="mt-0.5">
                              <span className="text-gray-500 text-xs uppercase tracking-wide">
                                To
                              </span>{" "}
                              {formatRequestDate(request.date_to)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          // Operators drive the early stages only; a booking
                          // past them is shown but not editable, matching the
                          // backend's operator stage rights.
                          const canEditStatus =
                            !operatorView ||
                            OPERATOR_STAGES.includes(request.status);
                          const rowStatusOptions = operatorView
                            ? statusOptions.filter(
                                (option) =>
                                  OPERATOR_STAGES.includes(option.value) ||
                                  option.value === "cancel_booking"
                              )
                            : statusOptions;

                          return (
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  statusStyles[request.status]
                                }`}
                              >
                                {
                                  statusOptions.find(
                                    (opt) => opt.value === request.status
                                  )?.label
                                }
                              </span>
                              {canEditStatus ? (
                                <select
                                  value={request.status}
                                  onChange={(e) =>
                                    onUpdateStatus(
                                      request.id,
                                      e.target.value as BookingRequestStatus
                                    )
                                  }
                                  disabled={updatingId === request.id}
                                  className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                                >
                                  {rowStatusOptions.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  Handled by TA-DA!
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <ViewingCell
                          request={request}
                          disabled={updatingId === request.id}
                          onPropose={onProposeViewing}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        <div>
                          {new Date(request.created_at).toLocaleString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Updated{" "}
                          {new Date(request.updated_at).toLocaleDateString(
                            "en-GB",
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestsSection;
