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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortState>({
    field: "created_at",
    direction: "desc",
  });
  const [selectedItem, setSelectedItem] = useState<User | Building | Property | null>(
    null
  );
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
      setLoading(true);
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
      } finally {
        setLoading(false);
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
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
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

      addNotification(
        "success",
        `User "${data.full_name}" updated successfully!`
      );
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
      console.log("🔄 Updating building:", { id, data, operator_id: data.operator_id });
      
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
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
          const updatedBuildingFromList = updatedBuildings.find((b: Building) => b.id === id);
          if (updatedBuildingFromList) {
            console.log("🔄 Updating selectedItem with:", updatedBuildingFromList);
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
    console.log('🎯 handleCreateProperty received data:', JSON.stringify(data, null, 2));
    setIsActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log('📮 Sending to API:', JSON.stringify(data, null, 2));
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
        `Property "${data.title || data.apartment_number || 'Property'}" created successfully!`
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
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create property";
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
          
          const updatedPropertyFromList = updatedProperties.find((p: Property) => p.id === id);
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
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Admin Panel
            </h2>
            <p className="text-xs text-slate-600">Management Console</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2 p-4">
        <button
          onClick={() => setActiveSection("users")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeSection === "users"
              ? "bg-violet-50 text-violet-700 border border-violet-200"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Users</span>
        </button>
        <button
          onClick={() => setActiveSection("buildings")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeSection === "buildings"
              ? "bg-violet-50 text-violet-700 border border-violet-200"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="font-medium">Buildings</span>
        </button>
        <button
          onClick={() => setActiveSection("properties")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeSection === "properties"
              ? "bg-violet-50 text-violet-700 border border-violet-200"
              : "text-slate-600 hover:bg-slate-50"
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
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading {activeSection}...</p>
          </div>
        </div>
      );
    }

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
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
                const headers = {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                };
                fetch(`${apiUrl}/buildings`, { headers })
                  .then(response => response.json())
                  .then(data => setBuildings(data.data || data || []))
                  .catch(error => console.error("Error refreshing buildings:", error));
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

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              View {activeSection.slice(0, -1)}
            </h3>
            <button
              onClick={() => setShowModal(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <pre className="text-sm">{JSON.stringify(selectedItem, null, 2)}</pre>
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
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">
              Delete {activeSection.slice(0, -1)}
            </h3>
            <button
              onClick={() => {
                setShowModal(null);
                setSelectedItem(null);
              }}
              disabled={isActionLoading}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mb-4 text-black">
            Are you sure you want to delete <strong>"{itemName}"</strong>? This
            action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowModal(null);
                setSelectedItem(null);
              }}
              disabled={isActionLoading}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isActionLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded disabled:opacity-50 flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-slate-50">
      <UniversalHeader />

      <div className="flex">
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
