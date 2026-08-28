import React from "react";
import { Clock, Phone, PhoneCall, User } from "lucide-react";
import {
  CALL_REASON_LABELS,
  CallRequest,
  PREFERRED_TIME_LABELS,
} from "../types/callRequest";

function formatSubmitted(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const sourceStyles: Record<CallRequest["source"], string> = {
  tenant: "bg-blue-50 text-blue-700 border border-blue-100",
  operator: "bg-purple-50 text-purple-700 border border-purple-100",
};

const sourceLabels: Record<CallRequest["source"], string> = {
  tenant: "Tenant",
  operator: "Operator",
};

interface AdminCallRequestsSectionProps {
  requests: CallRequest[];
  isLoading?: boolean;
}

/**
 * Read-only listing of the "Book a call" submissions. Unlike booking requests
 * there is no status to move: the row is a lead the support inbox already
 * received by email, and this table is the durable copy of it.
 */
export const AdminCallRequestsSection: React.FC<
  AdminCallRequestsSectionProps
> = ({ requests, isLoading }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-black">Call requests</h3>
          <p className="text-black">
            &quot;Book a call&quot; submissions from the tenant and operator
            landing pages
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider whitespace-nowrap">
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider min-w-[180px]">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider min-w-[200px]">
                  Reason
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Preferred time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider min-w-[220px]">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center space-x-2 text-black">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                      <span>Loading call requests...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-black">
                      <PhoneCall className="w-12 h-12 text-black mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No call requests yet
                      </h3>
                      <p>
                        Submissions from the landing pages will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  const times = request.preferred_times ?? [];

                  return (
                    <tr key={request.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap align-top">
                        {formatSubmitted(request.created_at)}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sourceStyles[request.source] ??
                            "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {sourceLabels[request.source] ?? request.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1.5 text-sm">
                          <div className="font-medium text-black flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600 shrink-0" />
                            {request.name}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span>
                              {request.phone_country_code} {request.phone_number}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-black">
                        {CALL_REASON_LABELS[request.reason] ?? request.reason}
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-gray-800">
                        {times.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {times.map((slug) => (
                              <span
                                key={slug}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                              >
                                <Clock className="w-3 h-3" />
                                {PREFERRED_TIME_LABELS[slug] ?? slug}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Not specified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-gray-800">
                        {request.notes?.trim() ? (
                          <span className="whitespace-pre-wrap break-words">
                            {request.notes}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
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

export default AdminCallRequestsSection;
