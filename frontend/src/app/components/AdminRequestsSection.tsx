import React, { useState } from "react";
import { CalendarClock, ChevronDown, ChevronRight, Mail } from "lucide-react";
import PhoneLinks from "@/shared/ui/PhoneLinks/PhoneLinks";
import { allowedBookingStatuses } from "@/shared/lib/bookingStatus";
import { BookingRequest, BookingRequestStatus } from "@/app/types/bookingRequest";

const COLUMN_COUNT = 6;

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatDate(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", DATE_FORMAT);
}

function formatDateTime(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", { ...DATE_FORMAT, hour: "2-digit", minute: "2-digit" });
}

/** "£2,000/mo". The price is a decimal column, so it arrives as a string. */
function formatBudget(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === "") return "—";
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "—";
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}/mo`;
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

const statusLabel = (status: BookingRequestStatus) =>
  statusOptions.find((option) => option.value === status)?.label ?? status;

/** A public page that answers 404 while the item is hidden. */
const HiddenHint: React.FC = () => (
  <span
    title="Not public: this link returns 404 while it is hidden"
    className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800"
  >
    Hidden
  </span>
);

const linkClass = "text-black underline underline-offset-2 hover:text-gray-500";

const DetailBlock: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {title}
    </div>
    <div className="space-y-1 text-sm text-gray-900">{children}</div>
  </div>
);

const RequestDetails: React.FC<{ request: BookingRequest }> = ({ request }) => {
  const email = request.email || request.tenant?.email;
  const phone = request.phone_number || request.tenant?.phone;

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr_1fr_1fr]">
      <DetailBlock title="Message">
        {request.description ? (
          <p className="whitespace-pre-wrap break-words">{request.description}</p>
        ) : (
          <span className="text-gray-500">No message</span>
        )}
      </DetailBlock>
      <DetailBlock title="Contact">
        {email ? (
          <a href={`mailto:${email}`} className={`flex items-center gap-1.5 break-all ${linkClass}`}>
            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-500" />
            {email}
          </a>
        ) : null}
        {phone ? <PhoneLinks phone={phone} className="text-black" /> : null}
        {!email && !phone ? <span className="text-gray-500">Not provided</span> : null}
      </DetailBlock>
      <DetailBlock title="Stay">
        <div>From {formatDate(request.date_from)}</div>
        <div>To {formatDate(request.date_to)}</div>
      </DetailBlock>
      <DetailBlock title="Viewing">
        <div>Proposed {formatDateTime(request.proposed_viewing_at)}</div>
        <div>Confirmed {formatDateTime(request.viewing_confirmed_at)}</div>
      </DetailBlock>
    </div>
  );
};

interface AdminRequestsSectionProps {
  requests: BookingRequest[];
  isLoading?: boolean;
  updatingId?: string | null;
  onUpdateStatus: (id: string, status: BookingRequestStatus) => void;
  onRefresh?: () => void;
}

export const AdminRequestsSection: React.FC<AdminRequestsSectionProps> = ({
  requests,
  isLoading,
  updatingId,
  onUpdateStatus,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const headerClass =
    "px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider whitespace-nowrap";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-black">Booking requests</h3>
        <p className="text-black">Open a row for the message and contact details</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className={headerClass}>Tenant</th>
                <th className={headerClass}>Property</th>
                <th className={headerClass}>Budget</th>
                <th className={headerClass}>CV</th>
                <th className={headerClass}>Submitted</th>
                <th className={headerClass}>Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center space-x-2 text-black">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                      <span>Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-black">
                      <CalendarClock className="w-12 h-12 text-black mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No booking requests yet
                      </h3>
                      <p>New tenant booking requests will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  const { property, tenant } = request;
                  const isExpanded = expandedId === request.id;
                  const toggle = () => setExpandedId(isExpanded ? null : request.id);
                  const tenantName = tenant?.full_name || tenant?.email || "Unknown tenant";
                  const propertyLabel =
                    property?.apartment_number || property?.title || "Unknown property";
                  const building = property?.building;
                  const buildingId = property?.building_id ?? building?.id;
                  const buildingHidden = building?.is_visible === false;
                  const allowed = allowedBookingStatuses(request.status);

                  return (
                    <React.Fragment key={request.id}>
                      <tr
                        data-testid="admin-request-row"
                        onClick={toggle}
                        className="cursor-pointer hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? "Hide" : "Show"} details for ${tenantName}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle();
                            }}
                            className="flex items-center gap-2 cursor-pointer text-left text-sm font-medium text-black"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                            )}
                            {tenantName}
                          </button>
                        </td>
                        {/* Links and the dropdown keep their clicks to themselves:
                            the row toggles on everything else. */}
                        <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2 font-medium">
                            {property ? (
                              <a
                                href={`/app/properties/${request.property_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className={linkClass}
                              >
                                {propertyLabel}
                              </a>
                            ) : (
                              propertyLabel
                            )}
                            {property?.is_visible === false || buildingHidden ? <HiddenHint /> : null}
                          </div>
                          {buildingId ? (
                            <a
                              href={`/app/buildings/${buildingId}`}
                              target="_blank"
                              rel="noreferrer"
                              className={`text-xs ${linkClass}`}
                            >
                              {building?.name || "Building"}
                            </a>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-sm text-black whitespace-nowrap">
                          {formatBudget(property?.price)}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {tenant?.tenantCv?.share_uuid ? (
                            <a
                              href={`/cv/${tenant.tenantCv.share_uuid}`}
                              target="_blank"
                              rel="noreferrer"
                              className={linkClass}
                            >
                              View CV
                            </a>
                          ) : (
                            <span className="text-gray-500">No CV</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[request.status]}`}
                            >
                              {statusLabel(request.status)}
                            </span>
                            {/* Only the transitions the API accepts; a closed
                                booking has none left. */}
                            <select
                              value={request.status}
                              onChange={(e) =>
                                onUpdateStatus(request.id, e.target.value as BookingRequestStatus)
                              }
                              disabled={updatingId === request.id || allowed.length === 1}
                              aria-label={`Status of the request from ${tenantName}`}
                              className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                            >
                              {allowed.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabel(status)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr data-testid="admin-request-details" className="bg-gray-50">
                          <td colSpan={COLUMN_COUNT} className="px-6 py-5">
                            <RequestDetails request={request} />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
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
