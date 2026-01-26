import React from "react";
import { CalendarClock, Mail, MapPin, User } from "lucide-react";
import { BookingRequest, BookingRequestStatus } from "../types/bookingRequest";

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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-black">
            Booking requests
          </h3>
          <p className="text-black">
            Track tenant booking requests and update statuses
          </p>
        </div>
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
                  Tenant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Dates
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center space-x-2 text-black">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                      <span>Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
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
                            <Mail className="w-3 h-3" />
                            {request.tenant?.email || "—"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>
                          Created:{" "}
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Updated:{" "}
                          {new Date(request.updated_at).toLocaleDateString()}
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
