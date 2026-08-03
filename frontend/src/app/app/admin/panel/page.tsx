"use client";

import { useState, useEffect } from "react";
// import { useSelector } from "react-redux";
import Link from "next/link";
// import {
//   selectUser,
//   selectIsAuthenticated,
// } from "@/store/slices/authSlice";
import UniversalHeader from "../../../components/UniversalHeader";
import SimpleDashboardRouter from "../../../components/SimpleDashboardRouter";
import { useDebounce } from "../../../hooks/useDebounce";
import GlassmorphismToast from "../../../components/GlassmorphismToast";
import AdminUsersSection from "../../../components/AdminUsersSection";
import AdminBuildingsSection from "../../../components/AdminBuildingsSection";
import AdminPropertiesSection from "../../../components/AdminPropertiesSection";
import AdminRequestsSection from "../../../components/AdminRequestsSection";
import AddUserModal from "../../../components/AddUserModal";
import AddBuildingModal from "../../../components/AddBuildingModal";
import AddPropertyModal from "../../../components/AddPropertyModal";
import EditUserModal from "../../../components/EditUserModal";
import EditBuildingModal from "../../../components/EditBuildingModal";
import EditPropertyModal from "../../../components/EditPropertyModal";
import ViewPropertyModal from "../../../components/ViewPropertyModal";
import { Copy, Check, X } from "lucide-react";
import {
  buildingsAPI,
} from "../../../lib/api";
import { Property } from "../../../types/property";
import {
  BookingRequest,
  BookingRequestStatus,
} from "../../../types/bookingRequest";
import {
  Users,
  Building2,
  Home,
  Calendar,
  FileText,
  SlidersHorizontal,
  LayoutGrid,
} from "lucide-react";
import {
  useGetPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
} from "@/store/api/properties.api";
import {
  useGetBookingRequestsQuery,
  useUpdateBookingRequestStatusMutation,
} from "@/store/api/bookingRequests.api";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
} from "@/store/api/users.api";
import {
  useCreateBuildingMutation,
  useDeleteBuildingMutation,
  useGetBuildingsQuery,
  useUpdateBuildingMutation,
  type Building as ApiBuilding,
} from "@/store/api/buildings.api";

type AdminSection = "users" | "buildings" | "properties" | "requests";

interface SortState {
  field: string;
  direction: "asc" | "desc";
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  status: string;
  created_at: string;
  is_private_landlord?: boolean | null;
}

/**
 * The panel no longer keeps its own copy of this shape: it hands the rows
 * straight from the query to the sections and modals, so the endpoint's type
 * is the honest one. The sections still carry their own narrower versions —
 * folding those together is step 5.2.
 */
type Building = ApiBuilding;

/**
 * A rejected RTK Query mutation carries `{ status, data }`, axios carries
 * `{ response: { data } }`, and a plain Error carries `message`. The panel now
 * mixes all three, so the message is pulled out in one place.
 */
function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      data?: { message?: unknown };
      response?: { data?: { message?: unknown } };
      message?: unknown;
    };

    if (typeof candidate.data?.message === "string") {
      return candidate.data.message;
    }
    if (typeof candidate.response?.data?.message === "string") {
      return candidate.response.data.message;
    }
    if (typeof candidate.message === "string") {
      return candidate.message;
    }
  }

  return fallback;
}

function AdminPanelContent() {
  // const user = useSelector(selectUser);
  // const isAuthenticated = useSelector(selectIsAuthenticated);
  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [sort, setSort] = useState<SortState>({
    field: "created_at",
    direction: "desc",
  });
  const [selectedItem, setSelectedItem] = useState<
    User | Building | Property | null
  >(null);
  const [showModal, setShowModal] = useState<
    "view" | "edit" | "add" | "delete" | null
  >(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "info";
      message: string;
    }>
  >([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(
    null,
  );

  // Users list via RTK Query. The mutations below invalidate it, so the table
  // refreshes itself instead of every handler refetching by hand.
  const { data: usersQueryData } = useGetUsersQuery(
    { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
    { skip: activeSection !== "users" },
  );
  const users: User[] = usersQueryData?.users ?? [];
  const totalPages = usersQueryData?.totalPages ?? 1;

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  // Buildings list, on the same footing: the section's mutations invalidate
  // Building:LIST, so nothing here reloads the list by hand.
  const { data: buildingsData } = useGetBuildingsQuery(undefined, {
    skip: activeSection !== "buildings",
  });
  const buildings: Building[] = buildingsData ?? [];

  const [createBuilding] = useCreateBuildingMutation();
  const [updateBuilding] = useUpdateBuildingMutation();
  const [deleteBuilding] = useDeleteBuildingMutation();

  // Admin properties list, fetched only while its tab is open, like the
  // other tabs. The endpoint is typed, so no envelope sniffing and no local
  // mirror — the section renders straight off the cache.
  const { data: propertiesData, isLoading: isPropsQueryLoading } =
    useGetPropertiesQuery(undefined, {
      skip: activeSection !== "properties",
    });
  const properties = propertiesData ?? [];

  const [createProperty] = useCreatePropertyMutation();
  const [updateProperty] = useUpdatePropertyMutation();
  const [deleteProperty] = useDeletePropertyMutation();

  // Booking requests via RTK Query (5‑минутный кэш)
  const {
    data: bookingQueryData,
    isLoading: isRequestsQueryLoading,
    isFetching: isRequestsQueryFetching,
  } = useGetBookingRequestsQuery(undefined, {
    // Загружаем только когда открыт раздел Requests
    skip: activeSection !== "requests",
  });

  const [updateBookingStatus] = useUpdateBookingRequestStatusMutation();

  // The query is the list; transformResponse already unwrapped it.
  const requests = bookingQueryData ?? [];

  // Notification management
  const addNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Reset page when section changes
  useEffect(() => {
    setPage(1);
  }, [activeSection]);

  // Event handlers
  const handleView = (item: User | Building | Property) => {
    setSelectedItem(item);
    setShowModal("view");
  };

  const handleEdit = (item: User | Building | Property) => {
    setSelectedItem(item);
    setShowModal("edit");
  };

  const handleDelete = (item: User | Building | Property) => {
    setSelectedItem(item);
    setShowModal("delete");
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    setIsActionLoading(true);
    try {
      if (activeSection === "buildings") {
        const building = selectedItem as Building;
        await deleteBuilding(building.id).unwrap();

        addNotification(
          "success",
          `Building "${building.name}" deleted successfully`,
        );
        setShowModal(null);
        setSelectedItem(null);
      } else if (activeSection === "properties") {
        const property = selectedItem as Property;

        // Tag invalidation drops the row from the refetched list.
        await deleteProperty(property.id).unwrap();

        const propertyTitle =
          property.title ||
          property.id ||
          property.apartment_number ||
          "Property";
        addNotification(
          "success",
          `Property "${propertyTitle}" deleted successfully`,
        );
        setShowModal(null);
        setSelectedItem(null);
      } else if (activeSection === "users") {
        const user = selectedItem as User;
        await deleteUser(user.id).unwrap();

        addNotification(
          "success",
          `User "${user.full_name || user.email}" deleted successfully`,
        );
        setShowModal(null);
        setSelectedItem(null);
      }
    } catch (error: unknown) {
      console.error("❌ Delete error:", error);
      addNotification(
        "error",
        apiErrorMessage(error, "Failed to delete item. Please try again."),
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setShowModal("add");
  };

  const handleCreateUser = async (data: {
    full_name: string;
    email: string;
    role: string;
    password: string;
    is_private_landlord?: boolean;
  }) => {
    setIsActionLoading(true);
    try {
      await createUser({
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        password: data.password || "defaultPassword123",
        is_private_landlord: data.is_private_landlord,
      }).unwrap();

      addNotification(
        "success",
        `User "${data.full_name}" created successfully!`,
      );
      setShowModal(null);
      // The list refetches itself: the mutation invalidates User:LIST.
    } catch (error: unknown) {
      addNotification(
        "error",
        `Failed to create user: ${apiErrorMessage(error, "Unknown error")}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateBuilding = async (data: Partial<Building>) => {
    setIsActionLoading(true);
    try {
      await createBuilding(data).unwrap();

      addNotification(
        "success",
        `Building "${data.name}" created successfully!`,
      );
      setShowModal(null);
      // The list refetches itself: the mutation invalidates Building:LIST.
    } catch (error: unknown) {
      addNotification(
        "error",
        `Failed to create building: ${apiErrorMessage(error, "Unknown error")}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateUser = async (
    id: string,
    data: {
      full_name: string;
      email: string;
      role: string;
      is_private_landlord?: boolean;
    },
  ) => {
    setIsActionLoading(true);
    try {
      const updatedUser = await updateUser({
        id,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        is_private_landlord: data.is_private_landlord,
      }).unwrap();

      addNotification(
        "success",
        `User "${data.full_name}" updated successfully!`,
      );

      // The endpoint answers with the updated user, so the open modal no longer
      // has to wait for a second request to the list to catch up.
      setSelectedItem(updatedUser);
      setShowModal(null);
    } catch (error: unknown) {
      addNotification(
        "error",
        `Failed to update user: ${apiErrorMessage(error, "Unknown error")}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateBuilding = async (id: string, data: Partial<Building>) => {
    setIsActionLoading(true);
    try {
      const updatedBuilding = await updateBuilding({ id, data }).unwrap();

      addNotification(
        "success",
        `Building "${data.name}" updated successfully!`,
      );

      // The endpoint answers with the updated building, so the open modal no
      // longer has to wait for a second request to the list to catch up.
      setSelectedItem(updatedBuilding);
      setShowModal(null);
    } catch (error: unknown) {
      console.error("❌ Failed to update building:", error);
      addNotification(
        "error",
        `Failed to update building: ${apiErrorMessage(error, "Unknown error")}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateProperty = async (data: any) => {
    setIsActionLoading(true);
    try {
      // Tag invalidation refetches the list; no manual reload needed.
      await createProperty(data).unwrap();

      addNotification(
        "success",
        `Property "${
          data.title || data.apartment_number || "Property"
        }" created successfully!`,
      );
      setShowModal(null);
    } catch (error: any) {
      console.error("Error creating property:", error);
      const errorMessage =
        error?.data?.message || error?.message || "Failed to create property";
      addNotification("error", `Failed to create property: ${errorMessage}`);
      // Don't close modal on error - let user see the error and try again
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateProperty = async (id: string, data: any) => {
    setIsActionLoading(true);
    try {
      // The PATCH answers with the updated property; the still-mounted edit
      // modal is re-fed from it while the list refetches by invalidation.
      const updatedProperty = await updateProperty({ id, data }).unwrap();

      const propertyTitle =
        updatedProperty.title ||
        data.title ||
        updatedProperty.apartment_number ||
        data.apartment_number ||
        "Property";
      addNotification(
        "success",
        `Property "${propertyTitle}" updated successfully!`,
      );
      setSelectedItem(updatedProperty);
      setShowModal(null);
    } catch (error: any) {
      console.error("❌ Failed to update property:", error);
      const errorMessage =
        error?.data?.message || error?.message || "Failed to update property";
      addNotification("error", `Failed to update property: ${errorMessage}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (
    id: string,
    status: BookingRequestStatus,
  ) => {
    try {
      setUpdatingRequestId(id);
      await updateBookingStatus({ id, status }).unwrap();
      // The list refetches itself — invalidatesTags on the mutation.
      addNotification("success", "Booking status updated");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update booking status";
      addNotification("error", message);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Sidebar
  const renderSidebar = () => (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200">
      <nav className="space-y-4 p-4">
        <button
          onClick={() => setActiveSection("users")}
          data-testid="admin-tab-users"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer duration-200 cursor-pointer ${
            activeSection === "users"
              ? "bg-gray-100 text-black"
              : "text-black hover:bg-gray-50"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Users</span>
        </button>
        <button
          onClick={() => setActiveSection("buildings")}
          data-testid="admin-tab-buildings"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
            activeSection === "buildings"
              ? "bg-gray-100 text-black"
              : "text-black hover:bg-gray-50"
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="font-medium">Buildings</span>
        </button>
        <button
          onClick={() => setActiveSection("properties")}
          data-testid="admin-tab-properties"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
            activeSection === "properties"
              ? "bg-gray-100 text-black"
              : "text-black hover:bg-gray-50"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Properties</span>
        </button>
        <button
          onClick={() => setActiveSection("requests")}
          data-testid="admin-tab-requests"
          className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 ${
            activeSection === "requests"
              ? "bg-gray-100 text-black"
              : "text-black hover:bg-gray-50"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Requests</span>
        </button>
      </nav>
    </div>
  );

  // Content rendering
  const renderContent = () => {
    switch (activeSection) {
      case "users":
        return (
          <AdminUsersSection
            users={users}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearchChange={(v) => { setSearchTerm(v); setPage(1); }}
            searchLoading={false}
            sort={sort}
            setSort={setSort}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        );
      case "buildings":
        return (
          <AdminBuildingsSection
            buildings={buildings}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchLoading={false}
            sort={sort}
            setSort={setSort}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onCopyId={(id) => {
              addNotification(
                "success",
                `Building ID "${id}" copied to clipboard`,
              );
            }}
          />
        );
      case "properties":
        return (
          <AdminPropertiesSection
            properties={properties}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchLoading={isPropsQueryLoading && !properties.length}
            sort={sort}
            setSort={setSort}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onCopyId={(id, _type) => {
              addNotification(
                "success",
                `${_type === "property" ? "Property" : "Building"} ID "${id}" copied to clipboard`,
              );
            }}
          />
        );
      case "requests":
        return (
          <AdminRequestsSection
            requests={requests}
            isLoading={isRequestsQueryLoading && !requests.length}
            updatingId={updatingRequestId}
            onUpdateStatus={handleUpdateBookingStatus}
          />
        );
      default:
        return null;
    }
  };

  // Simple modals for now
  const ViewModal = () => {
    if (!selectedItem || showModal !== "view") return null;

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const building =
      activeSection === "buildings" ? (selectedItem as Building) : null;
    const user = activeSection === "users" ? (selectedItem as User) : null;

    const handleCopyId = async (id: string, _type: "building") => {
      try {
        await navigator.clipboard.writeText(id);
        setCopiedId(id);
        addNotification("success", `Building ID "${id}" copied to clipboard`);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    const truncateId = (id: string, maxLength: number = 8) => {
      return id.length > maxLength ? `${id.substring(0, maxLength)}...` : id;
    };

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[8px] flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-black/50 backdrop-blur-[19px] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
            <h3 className="text-2xl font-bold text-white">
              {building
                ? building.name
                : user
                  ? user.full_name || user.email
                  : `View ${activeSection.slice(0, -1)}`}
            </h3>
            <button
              onClick={() => setShowModal(null)}
              className="p-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {user ? (
              <pre className="text-sm text-white/90 bg-black/30 p-4 rounded-lg overflow-auto whitespace-pre-wrap break-words">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            ) : building ? (
              <div className="space-y-6">
                {/* Key Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-[5px] border border-white/20 p-4 rounded-xl">
                    <div className="text-sm text-white/70 mb-1">
                      Building ID
                    </div>
                    <button
                      onClick={() =>
                        building.id && handleCopyId(building.id, "building")
                      }
                      className="flex items-center gap-1.5 font-mono text-sm text-white hover:text-white/80 transition-colors group w-full text-left"
                      title={`Click to copy: ${building.id}`}
                    >
                      <span className="text-lg font-semibold">
                        {truncateId(building.id || "", 8)}
                      </span>
                      {copiedId === building.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/50 group-hover:text-white/70" />
                      )}
                    </button>
                  </div>
                  <div className="bg-white/10 backdrop-blur-[5px] border border-white/20 p-4 rounded-xl">
                    <div className="text-sm text-white/70 mb-1">Address</div>
                    <div className="text-lg font-semibold text-white">
                      {building.address || "N/A"}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-[5px] border border-white/20 p-4 rounded-xl">
                    <div className="text-sm text-white/70 mb-1">Units</div>
                    <div className="text-lg font-semibold text-white">
                      {building.number_of_units || "-"}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-[5px] border border-white/20 p-4 rounded-xl">
                    <div className="text-sm text-white/70 mb-1">Unit Type</div>
                    <div className="text-lg font-semibold text-white">
                      {Array.isArray(building.type_of_unit)
                        ? building.type_of_unit.join(", ")
                        : building.type_of_unit || "-"}
                    </div>
                  </div>
                </div>

                {/* Building Details */}
                <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Building Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-white/70">Building ID</span>
                      <button
                        onClick={() =>
                          building.id && handleCopyId(building.id, "building")
                        }
                        className="flex items-center gap-1.5 font-mono text-sm text-white hover:text-white/80 transition-colors group"
                        title={`Click to copy: ${building.id}`}
                      >
                        <span className="font-medium">
                          {truncateId(building.id || "", 8)}
                        </span>
                        {copiedId === building.id ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-white/50 group-hover:text-white/70" />
                        )}
                      </button>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-white/70">Name</span>
                      <span className="font-medium text-white">
                        {building.name}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-white/70">Address</span>
                      <span className="font-medium text-white">
                        {building.address || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-white/70">Number of Units</span>
                      <span className="font-medium text-white">
                        {building.number_of_units || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-white/70">Unit Type</span>
                      <span className="font-medium text-white">
                        {Array.isArray(building.type_of_unit)
                          ? building.type_of_unit.join(", ")
                          : building.type_of_unit || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Media */}
                {(building.photos && building.photos.length > 0) ||
                building.logo ||
                building.video ||
                building.documents ? (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Media
                    </h3>
                    <div className="space-y-3">
                      {building.logo && (
                        <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-3 rounded-lg">
                          <div className="text-sm text-white/70 mb-2">Logo</div>
                          <img
                            src={building.logo}
                            alt="Building logo"
                            className="max-w-xs max-h-32 object-contain rounded-lg border border-white/20"
                          />
                        </div>
                      )}
                      {building.photos && building.photos.length > 0 && (
                        <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-3 rounded-lg">
                          <div className="text-sm text-white/70 mb-2">
                            Photos ({building.photos.length})
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {building.photos.slice(0, 6).map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Building photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-white/20"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {building.video && (
                        <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-3 rounded-lg">
                          <div className="text-sm text-white/70 mb-2">
                            Video
                          </div>
                          <video
                            src={building.video}
                            className="max-w-md max-h-64 border border-white/20 rounded-lg"
                            controls
                          />
                        </div>
                      )}
                      {building.documents && (
                        <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-3 rounded-lg">
                          <div className="text-sm text-white/70 mb-2">
                            Documents
                          </div>
                          <a
                            href={building.documents}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
                          >
                            View Documents (PDF)
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : user ? (
              <pre className="text-sm text-white/90 bg-black/30 p-4 rounded-lg overflow-auto whitespace-pre-wrap break-words">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            ) : (
              <pre className="text-sm text-white/90 bg-black/30 p-4 rounded-lg overflow-auto whitespace-pre-wrap break-words">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            )}
          </div>
          <div className="flex items-center justify-end p-6 border-t border-white/10 flex-shrink-0">
            <button
              onClick={() => setShowModal(null)}
              className="px-6 py-2.5 bg-white cursor-pointer text-black hover:bg-white/90 rounded-lg transition-all duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DeleteModal = () => {
    if (!selectedItem || showModal !== "delete") return null;

    const itemName =
      activeSection === "buildings"
        ? (selectedItem as Building).name
        : activeSection === "properties"
          ? (selectedItem as Property).apartment_number
          : (selectedItem as User).full_name ||
            (selectedItem as User).email ||
            "this item";

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-black/10 backdrop-blur-[5px] border border-white/10 rounded-3xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Delete {activeSection.slice(0, -1)}
            </h3>
            <button
              onClick={() => {
                setShowModal(null);
                setSelectedItem(null);
              }}
              disabled={isActionLoading}
              className="text-white/80 cursor-pointer hover:text-white disabled:opacity-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mb-4 text-white/90">
            Are you sure you want to delete{" "}
            <strong className="text-white">"{itemName}"</strong>? This action
            cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowModal(null);
                setSelectedItem(null);
              }}
              disabled={isActionLoading}
              className="flex-1 px-4 py-2 cursor-pointer text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isActionLoading}
              data-testid="confirm-delete"
              className="flex-1 px-4 py-2 cursor-pointer bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isActionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalHeader />

      <div className="pt-21 md:pt-13">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-2.5 flex items-center gap-4 md:gap-6 flex-wrap">
          <Link
            href="/app/tenant-cv"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>Tenant CV</span>
          </Link>
          <Link
            href="/app/preferences"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
            <span>Preferences</span>
          </Link>
          <Link
            href="/app/units"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
          >
            <LayoutGrid className="w-4 h-4 flex-shrink-0" />
            <span>Units</span>
          </Link>
        </div>
        <div className="flex">
          {renderSidebar()}
          <div className="flex-1 p-6">{renderContent()}</div>
        </div>
      </div>

      {activeSection !== "properties" && <ViewModal />}

      {activeSection === "properties" && (
        <ViewPropertyModal
          isOpen={showModal === "view"}
          onClose={() => setShowModal(null)}
          property={selectedItem as Property}
          onCopyId={(id, _type) => {
            addNotification(
              "success",
              `${_type === "property" ? "Property" : "Building"} ID "${id}" copied to clipboard`,
            );
          }}
        />
      )}

      <AddUserModal
        isOpen={activeSection === "users" && showModal === "add"}
        onClose={() => setShowModal(null)}
        onSubmit={handleCreateUser}
        isLoading={isActionLoading}
      />

      <AddBuildingModal
        isOpen={activeSection === "buildings" && showModal === "add"}
        onClose={() => setShowModal(null)}
        onSubmit={handleCreateBuilding}
        isLoading={isActionLoading}
      />

      <AddPropertyModal
        isOpen={activeSection === "properties" && showModal === "add"}
        onClose={() => setShowModal(null)}
        onSubmit={handleCreateProperty}
        isLoading={isActionLoading}
      />

      <EditUserModal
        isOpen={activeSection === "users" && showModal === "edit"}
        onClose={() => setShowModal(null)}
        user={selectedItem as User}
        onSubmit={handleUpdateUser}
        isLoading={isActionLoading}
      />

      <EditBuildingModal
        isOpen={activeSection === "buildings" && showModal === "edit"}
        onClose={() => setShowModal(null)}
        building={selectedItem as Building}
        onSubmit={handleUpdateBuilding}
        isLoading={isActionLoading}
      />

      <EditPropertyModal
        isOpen={activeSection === "properties" && showModal === "edit"}
        onClose={() => setShowModal(null)}
        property={selectedItem as Property}
        onSubmit={handleUpdateProperty}
        isLoading={isActionLoading}
      />

      <DeleteModal />

      <GlassmorphismToast
        notifications={notifications}
        onCloseNotification={removeNotification}
      />
    </div>
  );
}

export default function AdminPanel() {
  return (
    <SimpleDashboardRouter requiredRole="admin">
      <AdminPanelContent />
    </SimpleDashboardRouter>
  );
}
