"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import UniversalHeader from "../../../components/UniversalHeader";
import SimpleDashboardRouter from "../../../components/SimpleDashboardRouter";
import { useDebounce } from "../../../hooks/useDebounce";
import AdminNotifications from "../../../components/AdminNotifications";
import AdminUsersSection from "../../../components/AdminUsersSection";
import AdminBuildingsSection from "../../../components/AdminBuildingsSection";
import AdminPropertiesSection from "../../../components/AdminPropertiesSection";
import AddUserModal from "../../../components/AddUserModal";
import AddBuildingModal from "../../../components/AddBuildingModal";
import AddPropertyModal from "../../../components/AddPropertyModal";
import EditUserModal from "../../../components/EditUserModal";
import EditBuildingModal from "../../../components/EditBuildingModal";
import EditPropertyModal from "../../../components/EditPropertyModal";
import ViewPropertyModal from "../../../components/ViewPropertyModal";
import { buildingsAPI, propertiesAPI } from "../../../lib/api";
import { Property } from "../../../types/property";
import {
  Users,
  Building2,
  Home,
  Eye,
  Edit3,
  Trash2,
  Plus,
  X,
  Save,
} from "lucide-react";

type AdminSection = "users" | "buildings" | "properties";

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
}

interface Building {
  id: string;
  name: string;
  address: string;
  number_of_units: number;
  type_of_unit: string;
  logo?: string;
  video?: string;
  photos?: string[];
  documents?: string;
}

function AdminPanelContent() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 150);

  // Notification management
  const addNotification = (
    type: "success" | "error" | "info",
    message: string
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

  // Load data based on active section
  useEffect(() => {
    const loadData = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        };

        if (activeSection === "users") {
          const response = await fetch(`${apiUrl}/users`, { headers });
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users || data || []);
          }
        } else if (activeSection === "buildings") {
          const response = await fetch(`${apiUrl}/buildings`, { headers });
          if (response.ok) {
            const data = await response.json();
            setBuildings(data.data || data || []);
          }
        } else if (activeSection === "properties") {
          const response = await fetch(`${apiUrl}/properties`, { headers });
          if (response.ok) {
            const data = await response.json();
            setProperties(data.data || data || []);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        addNotification("error", "Failed to load data");
      }
    };

    loadData();
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      };

      if (activeSection === "buildings") {
        const building = selectedItem as Building;
        console.log("🗑️ Deleting building:", building.id);

        const response = await buildingsAPI.delete(building.id);
        console.log("✅ Delete response:", response);

        if (response.status === 200 || response.status === 204) {
          // Remove from local state
          setBuildings((prevBuildings) =>
            prevBuildings.filter((b) => b.id !== building.id)
          );

          addNotification(
            "success",
            `Building "${building.name}" deleted successfully`
          );
          setShowModal(null);
          setSelectedItem(null);
        } else {
          throw new Error("Unexpected response status");
        }
      } else if (activeSection === "properties") {
        const property = selectedItem as Property;
        console.log("🗑️ Deleting property:", property.id);

        const response = await propertiesAPI.delete(property.id);
        console.log("✅ Delete response:", response);

        if (response.status === 200 || response.status === 204) {
          // Remove from local state
          setProperties((prevProperties) =>
            prevProperties.filter((p) => p.id !== property.id)
          );

          addNotification(
            "success",
            `Property "${property.apartment_number}" deleted successfully`
          );
          setShowModal(null);
          setSelectedItem(null);
        } else {
          throw new Error("Unexpected response status");
        }
      } else if (activeSection === "users") {
        const user = selectedItem as User;
        const response = await fetch(`${apiUrl}/users/${user.id}`, {
          method: "DELETE",
          headers,
        });

        if (response.ok) {
          setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
          addNotification(
            "success",
            `User "${user.full_name || user.email}" deleted successfully`
          );
          setShowModal(null);
          setSelectedItem(null);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete user");
        }
      }
    } catch (error: any) {
      console.error("❌ Delete error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete item. Please try again.";
      addNotification("error", errorMessage);
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
  }) => {
    setIsActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const body = {
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        password: data.password || "defaultPassword123",
      };

      const response = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }

      addNotification(
        "success",
        `User "${data.full_name}" created successfully!`
      );
      setShowModal(null);

      // Reload users list
      if (activeSection === "users") {
        const response = await fetch(`${apiUrl}/users`, { headers });
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData.users || usersData || []);
        }
      }
    } catch (error: any) {
      addNotification("error", `Failed to create user: ${error.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateBuilding = async (data: any) => {
    setIsActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(`${apiUrl}/buildings`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create building");
      }

      addNotification(
        "success",
        `Building "${data.name}" created successfully!`
      );
      setShowModal(null);

      // Reload buildings list
      if (activeSection === "buildings") {
        const response = await fetch(`${apiUrl}/buildings`, { headers });
        if (response.ok) {
          const buildingsData = await response.json();
          setBuildings(buildingsData.data || buildingsData || []);
        }
      }
    } catch (error: any) {
      addNotification("error", `Failed to create building: ${error.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateUser = async (
    id: string,
    data: { full_name: string; email: string; role: string }
  ) => {
    setIsActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(`${apiUrl}/users/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      const updatedUser = await response.json();
      console.log("✅ User updated successfully:", updatedUser);

      addNotification(
        "success",
        `User "${data.full_name}" updated successfully!`
      );

      // Reload users list
      if (activeSection === "users") {
        const response = await fetch(`${apiUrl}/users`, { headers });
        if (response.ok) {
          const usersData = await response.json();
          const updatedUsers = usersData.users || usersData || [];
          setUsers(updatedUsers);

          // Update selectedItem with the updated user from the list
          const updatedUserFromList = updatedUsers.find(
            (u: User) => u.id === id
          );
          if (updatedUserFromList) {
            setSelectedItem(updatedUserFromList);
          }
        }
      }

      setShowModal(null);
    } catch (error: any) {
      addNotification("error", `Failed to update user: ${error.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateBuilding = async (id: string, data: any) => {
    setIsActionLoading(true);
    try {
      console.log("🔄 Updating building:", {
        id,
        data,
        operator_id: data.operator_id,
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(`${apiUrl}/buildings/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update building");
      }

      const updatedBuilding = await response.json();
      console.log("✅ Building updated successfully:", updatedBuilding);

      addNotification(
        "success",
        `Building "${data.name}" updated successfully!`
      );

      // Refresh buildings list and update selectedItem
      if (activeSection === "buildings") {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        };
        const response = await fetch(`${apiUrl}/buildings`, { headers });
        if (response.ok) {
          const buildingsData = await response.json();
          const updatedBuildings = buildingsData.data || buildingsData || [];
          setBuildings(updatedBuildings);

          // Update selectedItem with the updated building from the list
          const updatedBuildingFromList = updatedBuildings.find(
            (b: Building) => b.id === id
          );
          if (updatedBuildingFromList) {
            console.log(
              "🔄 Updating selectedItem with:",
              updatedBuildingFromList
            );
            setSelectedItem(updatedBuildingFromList);
          }
        }
      }

      setShowModal(null);
    } catch (error: any) {
      console.error("❌ Failed to update building:", error);
      addNotification("error", `Failed to update building: ${error.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateProperty = async (data: any) => {
    console.log(
      "🎯 handleCreateProperty received data:",
      JSON.stringify(data, null, 2)
    );
    setIsActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log("📮 Sending to API:", JSON.stringify(data, null, 2));
      const response = await fetch(`${apiUrl}/properties`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create property");
      }

      addNotification(
        "success",
        `Property "${
          data.title || data.apartment_number || "Property"
        }" created successfully!`
      );
      setShowModal(null);

      // Reload properties
      if (activeSection === "properties") {
        const response = await fetch(`${apiUrl}/properties`, { headers });
        if (response.ok) {
          const data = await response.json();
          setProperties(data.data || data || []);
        }
      }
    } catch (error: any) {
      console.error("Error creating property:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create property";
      addNotification("error", `Failed to create property: ${errorMessage}`);
      // Don't close modal on error - let user see the error and try again
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateProperty = async (id: string, data: any) => {
    setIsActionLoading(true);
    try {
      console.log("🔄 Updating property:", { id, data });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(`${apiUrl}/properties/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update property");
      }

      const updatedProperty = await response.json();
      console.log("✅ Property updated successfully:", updatedProperty);

      addNotification(
        "success",
        `Property "${data.apartment_number}" updated successfully!`
      );

      // Refresh properties list
      if (activeSection === "properties") {
        const response = await fetch(`${apiUrl}/properties`, { headers });
        if (response.ok) {
          const propertiesData = await response.json();
          const updatedProperties = propertiesData.data || propertiesData || [];
          setProperties(updatedProperties);

          const updatedPropertyFromList = updatedProperties.find(
            (p: Property) => p.id === id
          );
          if (updatedPropertyFromList) {
            setSelectedItem(updatedPropertyFromList);
          }
        }
      }

      setShowModal(null);
    } catch (error: any) {
      console.error("❌ Failed to update property:", error);
      addNotification("error", `Failed to update property: ${error.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Sidebar
  const renderSidebar = () => (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div>
            <img
              src="/black-logo.svg"
              alt="TADA Logo"
              className="h-8 cursor-pointer"
            />
            <p className="text-xs text-black">Management Console</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2 p-4">
        <button
          onClick={() => setActiveSection("users")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
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
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
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
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            activeSection === "properties"
              ? "bg-gray-100 text-black"
              : "text-black hover:bg-gray-50"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Properties</span>
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
            searchLoading={false}
            sort={sort}
            setSort={setSort}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
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
            onRefresh={() => {
              if (activeSection === "buildings") {
                const apiUrl =
                  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
                const headers = {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem(
                    "accessToken"
                  )}`,
                };
                fetch(`${apiUrl}/buildings`, { headers })
                  .then((response) => response.json())
                  .then((data) => setBuildings(data.data || data || []))
                  .catch((error) =>
                    console.error("Error refreshing buildings:", error)
                  );
              }
            }}
          />
        );
      case "properties":
        return (
          <AdminPropertiesSection
            properties={properties}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchLoading={false}
            sort={sort}
            setSort={setSort}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        );
      default:
        return null;
    }
  };

  // Simple modals for now
  const ViewModal = () => {
    if (!selectedItem || showModal !== "view") return null;

    const building =
      activeSection === "buildings" ? (selectedItem as Building) : null;
    const user = activeSection === "users" ? (selectedItem as User) : null;

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
                      {Array.isArray(building.type_of_unit) ? building.type_of_unit.join(", ") : building.type_of_unit || "-"}
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
                        {Array.isArray(building.type_of_unit) ? building.type_of_unit.join(", ") : building.type_of_unit || "-"}
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

      <div className="flex pt-20 md:pt-24">
        {renderSidebar()}
        <div className="flex-1 p-6">{renderContent()}</div>
      </div>

      {activeSection !== "properties" && <ViewModal />}

      {activeSection === "properties" && (
        <ViewPropertyModal
          isOpen={showModal === "view"}
          onClose={() => setShowModal(null)}
          property={selectedItem as Property}
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

      <AdminNotifications
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
