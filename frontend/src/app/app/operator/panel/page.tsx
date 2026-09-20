"use client";

import { useState } from "react";
import { Building2, Calendar, Home } from "lucide-react";

import UniversalHeader from "../../../components/UniversalHeader";
import SimpleDashboardRouter from "../../../components/SimpleDashboardRouter";
import GlassmorphismToast from "../../../components/GlassmorphismToast";
import AdminPropertiesSection, {
  EMPTY_PROPERTY_FILTERS,
  PropertyFilters,
  propertyFiltersToQuery,
} from "../../../components/AdminPropertiesSection";
import AdminRequestsSection from "../../../components/AdminRequestsSection";
import AdminBuildingsSection from "../../../components/AdminBuildingsSection";
import ViewPropertyModal from "../../../components/ViewPropertyModal";
import { useDebounce } from "../../../hooks/useDebounce";
import { apiErrorMessage } from "@/app/lib/apiErrorMessage";
import { Property } from "../../../types/property";
import { BookingRequestStatus } from "../../../types/bookingRequest";
import {
  ADMIN_PAGE_SIZE,
  useGetPropertiesQuery,
} from "@/store/api/properties.api";
import {
  useGetBookingRequestsQuery,
  useProposeViewingMutation,
  useUpdateBookingRequestStatusMutation,
} from "@/store/api/bookingRequests.api";
import {
  useGetBuildingsQuery,
  type Building,
} from "@/store/api/buildings.api";

type OperatorSection = "properties" | "requests" | "buildings";

/**
 * The operator's own slice of the admin panel (package D). The backend scopes
 * every read and write to the signed-in operator's properties, so this page
 * reuses the admin sections in their restricted modes: properties and
 * buildings are read-only tables, and the requests table offers only the
 * early pipeline stages (from `contract` on, the TA-DA! team drives the
 * deal). Admins pass the role gate too and see their own listings — the
 * admin panel remains the place they actually work.
 */
function OperatorPanelContent() {
  const [activeSection, setActiveSection] =
    useState<OperatorSection>("properties");

  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: "success" | "error" | "info"; message: string }>
  >([]);

  const addNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // --- Properties: the operator's own listings, server-scoped -------------
  const [propertyPage, setPropertyPage] = useState(1);
  const [propertySearch, setPropertySearch] = useState("");
  const debouncedPropertySearch = useDebounce(propertySearch, 400);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>(
    EMPTY_PROPERTY_FILTERS,
  );
  const [viewedProperty, setViewedProperty] = useState<Property | null>(null);

  const { data: propertiesData, isFetching: isPropsQueryFetching } =
    useGetPropertiesQuery(
      {
        page: propertyPage,
        limit: ADMIN_PAGE_SIZE,
        ...(debouncedPropertySearch ? { search: debouncedPropertySearch } : {}),
        ...propertyFiltersToQuery(propertyFilters),
      },
      { skip: activeSection !== "properties" },
    );
  const properties = propertiesData?.data ?? [];

  // --- Booking requests on the operator's properties ----------------------
  const [requestStatusFilter, setRequestStatusFilter] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(
    null,
  );

  const {
    data: bookingQueryData,
    isLoading: isRequestsQueryLoading,
    isFetching: isRequestsQueryFetching,
  } = useGetBookingRequestsQuery(requestStatusFilter || undefined, {
    skip: activeSection !== "requests",
  });
  const requests = bookingQueryData ?? [];

  const [updateBookingStatus] = useUpdateBookingRequestStatusMutation();
  const [proposeViewing] = useProposeViewingMutation();

  const handleUpdateBookingStatus = async (
    id: string,
    status: BookingRequestStatus,
  ) => {
    try {
      setUpdatingRequestId(id);
      await updateBookingStatus({ id, status }).unwrap();
      addNotification("success", "Booking status updated");
    } catch (error: unknown) {
      addNotification(
        "error",
        apiErrorMessage(error, "Failed to update booking status"),
      );
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleProposeViewing = async (id: string, proposedAtIso: string) => {
    try {
      setUpdatingRequestId(id);
      await proposeViewing({ id, proposed_viewing_at: proposedAtIso }).unwrap();
      addNotification(
        "success",
        "Viewing proposed — the tenant has been asked to confirm",
      );
    } catch (error: unknown) {
      addNotification(
        "error",
        apiErrorMessage(error, "Failed to propose the viewing"),
      );
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // --- Buildings: the operator's own, read-only ---------------------------
  const [buildingSearch, setBuildingSearch] = useState("");
  const [buildingSort, setBuildingSort] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({ field: "name", direction: "asc" });

  const { data: buildingsData } = useGetBuildingsQuery(undefined, {
    skip: activeSection !== "buildings",
  });
  const buildings: Building[] = buildingsData ?? [];

  const sidebarButton = (
    section: OperatorSection,
    label: string,
    Icon: typeof Home,
  ) => (
    <button
      onClick={() => setActiveSection(section)}
      data-testid={`operator-tab-${section}`}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
        activeSection === section
          ? "bg-gray-100 text-black"
          : "text-black hover:bg-gray-50"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "properties":
        return (
          <AdminPropertiesSection
            properties={properties}
            total={propertiesData?.total ?? 0}
            page={propertiesData?.page ?? propertyPage}
            totalPages={propertiesData?.totalPages ?? 1}
            onPageChange={setPropertyPage}
            searchTerm={propertySearch}
            onSearchChange={(value) => {
              setPropertySearch(value);
              setPropertyPage(1);
            }}
            searchLoading={isPropsQueryFetching}
            filters={propertyFilters}
            onFiltersChange={(next) => {
              setPropertyFilters(next);
              setPropertyPage(1);
            }}
            onView={setViewedProperty}
            readOnly
            title="My properties"
            subtitle="Your listings as the market sees them — statuses move with the booking pipeline"
          />
        );
      case "requests":
        return (
          <AdminRequestsSection
            requests={requests}
            isLoading={
              (isRequestsQueryLoading || isRequestsQueryFetching) &&
              !requests.length
            }
            updatingId={updatingRequestId}
            onUpdateStatus={handleUpdateBookingStatus}
            statusFilter={requestStatusFilter}
            onStatusFilterChange={setRequestStatusFilter}
            onProposeViewing={handleProposeViewing}
            operatorView
            subtitle="Requests on your properties — you drive them up to the viewing; TA-DA! takes over from the contract stage"
          />
        );
      case "buildings":
        return (
          <AdminBuildingsSection
            buildings={buildings}
            searchTerm={buildingSearch}
            setSearchTerm={setBuildingSearch}
            searchLoading={false}
            sort={buildingSort}
            setSort={setBuildingSort}
            onView={(building) =>
              window.open(`/app/buildings/${building.id}`, "_blank")
            }
            readOnly
            title="My buildings"
            subtitle="Buildings on your account — managed by the TA-DA! team"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalHeader />

      <div className="pt-21 md:pt-13">
        <div className="flex">
          <div className="w-64 min-h-screen bg-white border-r border-gray-200">
            <nav className="space-y-4 p-4">
              {sidebarButton("properties", "My properties", Home)}
              {sidebarButton("requests", "Requests", Calendar)}
              {sidebarButton("buildings", "My buildings", Building2)}
            </nav>
          </div>
          <div className="flex-1 p-6">{renderContent()}</div>
        </div>
      </div>

      <ViewPropertyModal
        isOpen={viewedProperty !== null}
        onClose={() => setViewedProperty(null)}
        property={viewedProperty}
      />

      <GlassmorphismToast
        notifications={notifications}
        onCloseNotification={(id) =>
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
      />
    </div>
  );
}

export default function OperatorPanel() {
  return (
    <SimpleDashboardRouter requiredRole="operator">
      <OperatorPanelContent />
    </SimpleDashboardRouter>
  );
}
