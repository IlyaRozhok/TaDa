"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import DashboardHeader from "../../../components/DashboardHeader";
import SimpleDashboardRouter from "../../../components/SimpleDashboardRouter";
import { useDebounce } from "../../../lib/utils";
import AdminNotifications from "../../../components/AdminNotifications";
import {
  Users,
  Building2,
  UserPlus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Shield,
  Eye,
  Target,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Save,
  Plus,
} from "lucide-react";

type AdminSection = "users" | "properties";

interface FilterState {
  role?: string;
  status?: string;
  property_type?: string;
  bedrooms?: string;
  location?: string;
  [key: string]: string | number | boolean | undefined;
}

interface SortState {
  field: string;
  direction: "asc" | "desc";
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  created_at: string;
  description?: string;
  furnished?: string;
  operator_id?: string;
  property_media?: unknown[];
}

interface PreferencesRow {
  id: string;
  user_id: string;
  primary_postcode: string;
  secondary_location: string;
  commute_location: string;
  commute_time_walk: number;
  commute_time_cycle: number;
  commute_time_tube: number;
  move_in_date: string;
  min_price: number;
  max_price: number;
  min_bedrooms: number;
  max_bedrooms: number;
  min_bathrooms: number;
  max_bathrooms: number;
  furnishing: string;
  let_duration: string;
  property_type: string;
  building_style: string[];
  designer_furniture: boolean;
  house_shares: string;
  date_property_added: string;
  lifestyle_features: string[];
  social_features: string[];
  work_features: string[];
  convenience_features: string[];
  pet_friendly_features: string[];
  luxury_features: string[];
  hobbies: string[];
  ideal_living_environment: string;
  pets: string;
  smoker: boolean;
  additional_info: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  full_name?: string;
  created_at: string;
  tenantProfile?: unknown;
  operatorProfile?: unknown;
  phone?: string;
}

// Search component to avoid re-renders
const SearchBar = React.memo(
  ({
    searchTerm,
    setSearchTerm,
    activeSection,
    searchLoading,
  }: {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    activeSection: string;
    searchLoading: boolean;
  }) => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
      <input
        type="text"
        placeholder={`Search ${activeSection}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {searchLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
);

SearchBar.displayName = "SearchBar";

function AdminPanelContent() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [userPreferences, setUserPreferences] = useState<PreferencesRow | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<SortState>({
    field: "created_at",
    direction: "desc",
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedItem, setSelectedItem] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [showModal, setShowModal] = useState<
    "view" | "edit" | "add" | "delete" | null
  >(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "preferences">("info"); // For user detail tabs
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "info";
      message: string;
    }>
  >([]);

  // Debounced search term with reduced delay
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

  // User Preferences Tab Component
  const UserPreferencesTab = ({
    userId,
    preferences,
    loading,
    onPreferencesUpdate,
  }: {
    userId: string;
    preferences: PreferencesRow | null;
    loading: boolean;
    onPreferencesUpdate: () => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
      primary_postcode: preferences?.primary_postcode || "",
      secondary_location: preferences?.secondary_location || "",
      min_price: preferences?.min_price || 0,
      max_price: preferences?.max_price || 0,
      min_bedrooms: preferences?.min_bedrooms || 0,
      max_bedrooms: preferences?.max_bedrooms || 0,
      property_type: preferences?.property_type || "any",
      furnishing: preferences?.furnishing || "any",
    });

    const handleSavePreferences = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const token = localStorage.getItem("accessToken");

        const endpoint = preferences
          ? `${apiUrl}/preferences/admin/${userId}`
          : `${apiUrl}/preferences`;

        const response = await fetch(endpoint, {
          method: preferences ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to save preferences");
        }

        addNotification("success", "Preferences saved successfully!");
        setIsEditing(false);
        onPreferencesUpdate();
      } catch (error: any) {
        addNotification(
          "error",
          `Failed to save preferences: ${error.message}`
        );
      }
    };

    const handleDeletePreferences = async () => {
      if (!preferences) return;

      if (!confirm("Are you sure you want to delete these preferences?"))
        return;

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const token = localStorage.getItem("accessToken");

        const response = await fetch(`${apiUrl}/preferences/admin/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete preferences");
        }

        addNotification("success", "Preferences deleted successfully!");
        onPreferencesUpdate();
      } catch (error: any) {
        addNotification(
          "error",
          `Failed to delete preferences: ${error.message}`
        );
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading preferences...</p>
          </div>
        </div>
      );
    }

    if (!preferences && !isEditing) {
      return (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No preferences found
          </h3>
          <p className="text-slate-600 mb-6">
            This user hasn't set up their preferences yet.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Preferences
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {!isEditing ? (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">
                User Preferences
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                {preferences && (
                  <button
                    onClick={handleDeletePreferences}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>

            {preferences && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-slate-600">
                    Primary Postcode
                  </label>
                  <p className="text-slate-900">
                    {preferences.primary_postcode || "Not specified"}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-slate-600">
                    Secondary Location
                  </label>
                  <p className="text-slate-900">
                    {preferences.secondary_location || "Not specified"}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-slate-600">
                    Price Range
                  </label>
                  <p className="text-slate-900">
                    £{preferences.min_price?.toLocaleString() || 0} - £
                    {preferences.max_price?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-slate-600">
                    Bedrooms
                  </label>
                  <p className="text-slate-900">
                    {preferences.min_bedrooms || 0} -{" "}
                    {preferences.max_bedrooms || 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-slate-600">
                    Property Type
                  </label>
                  <p className="text-slate-900">
                    {preferences.property_type || "Any"}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-slate-600">
                    Furnishing
                  </label>
                  <p className="text-slate-900">
                    {preferences.furnishing || "Any"}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">
                {preferences ? "Edit" : "Create"} Preferences
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Postcode
                </label>
                <input
                  type="text"
                  value={formData.primary_postcode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primary_postcode: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., SW1A 1AA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Secondary Location
                </label>
                <input
                  type="text"
                  value={formData.secondary_location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      secondary_location: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Central London"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  value={formData.min_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={formData.max_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Min Bedrooms
                </label>
                <input
                  type="number"
                  value={formData.min_bedrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_bedrooms: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Bedrooms
                </label>
                <input
                  type="number"
                  value={formData.max_bedrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_bedrooms: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Property Type
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) =>
                    setFormData({ ...formData, property_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="any">Any</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Furnishing
                </label>
                <select
                  value={formData.furnishing}
                  onChange={(e) =>
                    setFormData({ ...formData, furnishing: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="any">Any</option>
                  <option value="furnished">Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="part_furnished">Part Furnished</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const fetchData = useCallback(
    async (isInitialLoad = false) => {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      setError(null);

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const token = localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("No authentication token");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Build query parameters
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
          ...(sort.field && { sortBy: sort.field }),
          ...(sort.direction && { order: sort.direction.toUpperCase() }),
          ...Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              acc[key] = value.toString();
            }
            return acc;
          }, {} as Record<string, string>),
        });

        switch (activeSection) {
          case "users":
            const usersResponse = await fetch(`${apiUrl}/users?${params}`, {
              headers,
            });
            if (!usersResponse.ok) throw new Error("Failed to fetch users");
            const usersData = await usersResponse.json();
            if (usersData.data) {
              setUsers(usersData.data);
              setPagination((prev) => ({
                ...prev,
                total: usersData.total || 0,
                totalPages:
                  usersData.totalPages ||
                  Math.ceil((usersData.total || 0) / prev.limit),
              }));
            } else {
              const usersArray = Array.isArray(usersData) ? usersData : [];
              setUsers(usersArray);
              setPagination((prev) => ({
                ...prev,
                total: usersArray.length,
                totalPages: Math.ceil(usersArray.length / prev.limit),
              }));
            }
            break;

          case "properties":
            const propertiesResponse = await fetch(
              `${apiUrl}/properties?${params}`,
              {
                headers,
              }
            );
            if (!propertiesResponse.ok)
              throw new Error("Failed to fetch properties");
            const propertiesData = await propertiesResponse.json();
            if (propertiesData.data) {
              setProperties(propertiesData.data);
              setPagination((prev) => ({
                ...prev,
                total: propertiesData.total || 0,
                totalPages:
                  propertiesData.totalPages ||
                  Math.ceil((propertiesData.total || 0) / prev.limit),
              }));
            } else {
              const propertiesArray = Array.isArray(propertiesData)
                ? propertiesData
                : [];
              setProperties(propertiesArray);
              setPagination((prev) => ({
                ...prev,
                total: propertiesArray.length,
                totalPages: Math.ceil(propertiesArray.length / prev.limit),
              }));
            }
            break;
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch data";

        // Only show notification error for initial load, not for search operations
        if (isInitialLoad) {
          addNotification(
            "error",
            `Failed to load ${activeSection}: ${errorMessage}`
          );
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    },
    [
      activeSection,
      pagination.page,
      pagination.limit,
      debouncedSearchTerm,
      sort,
      filters,
    ]
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData(true); // Initial load
    }
  }, [isAuthenticated, user]);

  // Separate effect for search/sort/filter changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData(); // Search/filter load
    }
  }, [
    debouncedSearchTerm,
    sort,
    filters,
    pagination.page,
    pagination.limit,
    activeSection,
  ]);

  // Fetch user preferences
  const fetchUserPreferences = async (userId: string) => {
    setPreferencesLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${apiUrl}/preferences/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const preferences = await response.json();
        setUserPreferences(preferences);
      } else {
        setUserPreferences(null); // User has no preferences yet
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      setUserPreferences(null);
    } finally {
      setPreferencesLoading(false);
    }
  };

  // CRUD Operations
  const handleAdd = () => {
    setSelectedItem(null);
    setShowModal("add");
  };

  const handleEdit = (item: unknown) => {
    setSelectedItem(item as Record<string, unknown>);
    setShowModal("edit");
  };

  const handleDelete = (item: unknown) => {
    setSelectedItem(item as Record<string, unknown>);
    setShowModal("delete");
  };

  const handleView = (item: unknown) => {
    setSelectedItem(item as Record<string, unknown>);
    setShowModal("view");
    setActiveTab("info"); // Reset to info tab when opening modal

    // If viewing a user, fetch their preferences
    if (activeSection === "users" && item) {
      const user = item as User;
      fetchUserPreferences(user.id);
    }
  };

  const handleSort = (field: string) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    setIsActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      let endpoint = "";
      switch (activeSection) {
        case "users":
          endpoint = `${apiUrl}/users/${selectedItem.id}`;
          break;
        case "properties":
          endpoint = `${apiUrl}/properties/${selectedItem.id}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete item");
      }

      // Show success toast based on section
      const itemType =
        activeSection === "users"
          ? "User"
          : activeSection === "properties"
          ? "Property"
          : "Preferences";
      const itemName =
        activeSection === "users"
          ? (selectedItem as unknown as User).full_name ||
            (selectedItem as unknown as User).email
          : activeSection === "properties"
          ? (selectedItem as unknown as Property).title
          : (selectedItem as unknown as PreferencesRow).user?.email ||
            "User preferences";

      addNotification(
        "success",
        `${itemType} "${itemName}" deleted successfully`
      );

      setShowModal(null);
      setSelectedItem(null);
      fetchData(false); // Refresh data without full loader
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete item";
      addNotification("error", `Delete failed: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };

  // UI Components
  const SortButton = ({
    field,
    label,
    compact = false,
  }: {
    field: string;
    label: string;
    compact?: boolean;
  }) => {
    const isActive = sort.field === field;
    const isAsc = isActive && sort.direction === "asc";
    const isDesc = isActive && sort.direction === "desc";

    return (
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1 font-medium transition-colors duration-200 ${
          compact
            ? `text-xs ${
                isActive
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-slate-500 hover:text-slate-700"
              }`
            : `${
                isActive
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-slate-600 hover:text-slate-900"
              }`
        }`}
        title={
          isActive
            ? `Sorted by ${label} (${
                sort.direction === "asc" ? "ascending" : "descending"
              }). Click to reverse.`
            : `Sort by ${label}`
        }
      >
        {label}
        {isActive ? (
          isAsc ? (
            <ArrowUp
              className={`text-blue-600 ${compact ? "w-3 h-3" : "w-4 h-4"}`}
            />
          ) : (
            <ArrowDown
              className={`text-blue-600 ${compact ? "w-3 h-3" : "w-4 h-4"}`}
            />
          )
        ) : (
          <ArrowUpDown
            className={`opacity-50 hover:opacity-75 ${
              compact ? "w-3 h-3" : "w-4 h-4"
            }`}
          />
        )}
      </button>
    );
  };

  const FilterDropdown = () => (
    <div className="relative">
      <select
        value={filters.role || ""}
        onChange={(e) =>
          handleFilterChange({ role: e.target.value || undefined })
        }
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="operator">Operator</option>
        <option value="tenant">Tenant</option>
      </select>
      <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
    </div>
  );

  const Pagination = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">
          Showing{" "}
          {Math.min(
            (pagination.page - 1) * pagination.limit + 1,
            pagination.total
          )}{" "}
          to {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} results
        </span>
        <select
          value={pagination.limit}
          onChange={(e) => handleLimitChange(parseInt(e.target.value))}
          className="ml-4 px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-sm text-slate-600">
          Page {pagination.page} of {pagination.totalPages}
        </span>

        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-slate-200 h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Admin Panel
            </h2>
            <p className="text-sm text-slate-600">System Management</p>
          </div>
        </div>

        <nav className="space-y-2">
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
            onClick={() => setActiveSection("properties")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "properties"
                ? "bg-violet-50 text-violet-700 border border-violet-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="font-medium">Properties</span>
          </button>
        </nav>
      </div>
    </div>
  );

  const renderUsersSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">
            Users Management
          </h3>
          <p className="text-slate-600">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white text-black rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeSection={activeSection}
                searchLoading={searchLoading}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {sort.field && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Sorted by:</span>
                  <span className="font-medium text-blue-600">
                    {sort.field === "full_name"
                      ? "Name"
                      : sort.field === "role"
                      ? "Role"
                      : sort.field === "status"
                      ? "Status"
                      : sort.field === "created_at"
                      ? "Created Date"
                      : sort.field}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({sort.direction === "asc" ? "↑ ascending" : "↓ descending"}
                    )
                  </span>
                  <button
                    onClick={() => setSort({ field: "", direction: "desc" })}
                    className="text-xs text-slate-400 hover:text-slate-600 underline ml-2"
                    title="Clear sorting"
                  >
                    clear
                  </button>
                </div>
              )}
              <FilterDropdown />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-1/3" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-32" />
              <col className="w-32" />
            </colgroup>
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="full_name" label="User" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="role" label="Role" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="status" label="Status" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="created_at" label="Created" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                        <Users className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <div
                          className="text-sm font-semibold text-slate-900 truncate"
                          title={user.full_name || "No name"}
                        >
                          {user.full_name || "No name"}
                        </div>
                        <div
                          className="text-sm text-slate-600 truncate"
                          title={user.email}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : user.role === "operator"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-green-100 text-green-800 border border-green-200"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : user.status === "inactive"
                          ? "bg-slate-100 text-slate-800 border border-slate-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleView(user)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
                        title="View user"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors duration-150"
                        title="Edit user"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-150"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <Pagination />
        </div>
      </div>
    </div>
  );

  const renderPropertiesSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">
            Properties Management
          </h3>
          <p className="text-slate-600">Manage property listings and details</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeSection={activeSection}
                searchLoading={searchLoading}
              />
            </div>
            {sort.field && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Sorted by:</span>
                <span className="font-medium text-blue-600">
                  {sort.field === "title"
                    ? "Title"
                    : sort.field === "location"
                    ? "Location"
                    : sort.field === "price"
                    ? "Price"
                    : sort.field === "bedrooms"
                    ? "Bedrooms"
                    : sort.field === "bathrooms"
                    ? "Bathrooms"
                    : sort.field === "property_type"
                    ? "Type"
                    : sort.field === "created_at"
                    ? "Created Date"
                    : sort.field}
                </span>
                <span className="text-xs text-slate-500">
                  ({sort.direction === "asc" ? "↑ ascending" : "↓ descending"})
                </span>
                <button
                  onClick={() => setSort({ field: "", direction: "desc" })}
                  className="text-xs text-slate-400 hover:text-slate-600 underline ml-2"
                  title="Clear sorting"
                >
                  clear
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-1/4" />
              <col className="w-24" />
              <col className="w-16" />
              <col className="w-16" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-28" />
            </colgroup>
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs">Property</div>
                    <div className="flex gap-2 text-xs">
                      <SortButton field="title" label="Title" compact={true} />
                      <span className="text-slate-400">|</span>
                      <SortButton
                        field="location"
                        label="Location"
                        compact={true}
                      />
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="price" label="Price" />
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="bedrooms" label="Bedrooms" />
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="bathrooms" label="Baths" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="property_type" label="Type" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="created_at" label="Created" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {properties.map((property) => (
                <tr
                  key={property.id}
                  className="hover:bg-slate-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <div
                          className="text-sm font-semibold text-slate-900 truncate"
                          title={property.title}
                        >
                          {property.title}
                        </div>
                        <div
                          className="text-sm text-slate-600 truncate"
                          title={property.location}
                        >
                          {property.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    £{property.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                    {property.bedrooms}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                    {property.bathrooms}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <span
                      className="truncate block"
                      title={property.property_type}
                    >
                      {property.property_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(property.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleView(property)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
                        title="View property"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(property)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors duration-150"
                        title="Edit property"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(property)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-150"
                        title="Delete property"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <Pagination />
        </div>
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">
            User Preferences
          </h3>
          <p className="text-slate-600">
            Manage user search preferences and requirements
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeSection={activeSection}
            searchLoading={searchLoading}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="min_price" label="Budget" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="min_bedrooms" label="Bedrooms" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="property_type" label="Type" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {userPreferences && (
                <tr
                  key={userPreferences.id}
                  className="hover:bg-slate-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full flex items-center justify-center shadow-sm">
                        <Target className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {userPreferences.user?.full_name || "No name"}
                        </div>
                        <div className="text-sm text-slate-600">
                          {userPreferences.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    £{userPreferences.min_price?.toLocaleString() || 0} - £
                    {userPreferences.max_price?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {userPreferences.min_bedrooms || 0} -{" "}
                    {userPreferences.max_bedrooms || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {userPreferences.property_type || "Any"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {userPreferences.primary_postcode ||
                      userPreferences.secondary_location ||
                      "Not specified"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleView(userPreferences)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                        title="View preferences"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(userPreferences)}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-150"
                        title="Edit preferences"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(userPreferences)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-150"
                        title="Delete preferences"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <Pagination />
        </div>
      </div>
    </div>
  );

  // Modal Components
  const ViewModal = () => {
    if (!selectedItem || showModal !== "view") return null;

    const isUserView = activeSection === "users";

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isUserView
                    ? `User: ${
                        (selectedItem as any).full_name ||
                        (selectedItem as any).email
                      }`
                    : `View ${activeSection.slice(0, -1)}`}
                </h2>
                <p className="text-slate-600 text-sm">
                  Detailed information overview
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isUserView ? (
            // User view with tabs
            <div>
              {/* Tabs */}
              <div className="flex border-b border-slate-200 mb-6">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === "info"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  User Information
                </button>
                <button
                  onClick={() => setActiveTab("preferences")}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === "preferences"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Preferences
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "info" ? (
                <div className="space-y-6">
                  {Object.entries(selectedItem).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-xl border border-slate-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="font-semibold text-slate-700 capitalize min-w-[150px]">
                          {key.replace(/_/g, " ")}:
                        </div>
                        <div className="text-slate-900 font-medium">
                          {key === "status" || key === "role" ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                key === "status"
                                  ? value === "active"
                                    ? "bg-green-100 text-green-800"
                                    : value === "inactive"
                                    ? "bg-slate-100 text-slate-800"
                                    : "bg-red-100 text-red-800"
                                  : value === "admin"
                                  ? "bg-amber-100 text-amber-800"
                                  : value === "operator"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {String(value)}
                            </span>
                          ) : typeof value === "object" ? (
                            JSON.stringify(value, null, 2)
                          ) : (
                            String(value)
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Preferences tab
                <UserPreferencesTab
                  userId={(selectedItem as any).id}
                  preferences={userPreferences}
                  loading={preferencesLoading}
                  onPreferencesUpdate={() =>
                    fetchUserPreferences((selectedItem as any).id)
                  }
                />
              )}
            </div>
          ) : (
            // Simple view for non-user items
            <div className="space-y-6">
              {Object.entries(selectedItem).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-xl border border-slate-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="font-semibold text-slate-700 capitalize min-w-[150px]">
                      {key.replace(/_/g, " ")}:
                    </div>
                    <div className="text-slate-900 font-medium">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const AddEditUserModal = () => {
    const isEditing = showModal === "edit";
    const [formData, setFormData] = useState({
      full_name: isEditing ? (selectedItem?.full_name as string) || "" : "",
      email: isEditing ? (selectedItem?.email as string) || "" : "",
      password: "",
      role: isEditing ? (selectedItem?.role as string) || "tenant" : "tenant",
      phone: isEditing ? (selectedItem?.phone as string) || "" : "",
    });

    if (
      !showModal ||
      (showModal !== "add" && showModal !== "edit") ||
      activeSection !== "users"
    )
      return null;
    if (showModal === "edit" && !selectedItem) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem && isEditing) return;

      setIsActionLoading(true);

      try {
        if (!formData.full_name?.trim()) {
          throw new Error("Full name is required");
        }
        if (!formData.email?.trim()) {
          throw new Error("Email is required");
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const token = localStorage.getItem("accessToken");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const endpoint = isEditing
          ? `${apiUrl}/users/${selectedItem?.id}`
          : `${apiUrl}/users`;

        const body = {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          ...(formData.phone?.trim() && { phone: formData.phone.trim() }),
          ...(!isEditing && {
            password: formData.password || "defaultPassword123",
          }),
        };

        const response = await fetch(endpoint, {
          method: isEditing ? "PUT" : "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Failed to ${isEditing ? "update" : "create"} user`
          );
        }

        // Show success toast
        const action = isEditing ? "updated" : "created";
        const userName = formData.full_name || formData.email;

        addNotification(
          "success",
          `User "${userName}" ${action} successfully!`
        );

        setShowModal(null);
        setSelectedItem(null);
        fetchData(false);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to ${isEditing ? "update" : "create"} user`;

        addNotification(
          "error",
          `${isEditing ? "Update" : "Creation"} failed: ${errorMessage}`
        );
        setError(errorMessage);
      } finally {
        setIsActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                {isEditing ? (
                  <Edit3 className="w-5 h-5 text-white" />
                ) : (
                  <UserPlus className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isEditing ? "Edit User" : "Add User"}
                </h2>
                <p className="text-slate-600 text-sm">
                  {isEditing
                    ? "Update user information"
                    : "Create a new user account"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  placeholder="Enter email address"
                  required
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="Leave empty for default password"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                >
                  <option value="tenant">Tenant</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
              >
                {isActionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isEditing ? "Updating..." : "Creating..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? "Update User" : "Create User"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddEditPropertyModal = () => {
    const isEditing = showModal === "edit";
    const [formData, setFormData] = useState({
      title: isEditing ? (selectedItem?.title as string) || "" : "",
      description: isEditing ? (selectedItem?.description as string) || "" : "",
      address: isEditing ? (selectedItem?.address as string) || "" : "",
      price: isEditing ? (selectedItem?.price as number) || 0 : 0,
      bedrooms: isEditing ? (selectedItem?.bedrooms as number) || 1 : 1,
      bathrooms: isEditing ? (selectedItem?.bathrooms as number) || 1 : 1,
      property_type: isEditing
        ? (selectedItem?.property_type as string) || "apartment"
        : "apartment",
      furnishing: isEditing
        ? (selectedItem?.furnishing as string) || "furnished"
        : "furnished",
      available_from: isEditing
        ? (selectedItem?.available_from as string) || ""
        : "",
    });

    if (
      !showModal ||
      (showModal !== "add" && showModal !== "edit") ||
      activeSection !== "properties"
    )
      return null;
    if (showModal === "edit" && !selectedItem) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem && isEditing) return;

      setIsActionLoading(true);

      try {
        if (!formData.title?.trim()) {
          throw new Error("Title is required");
        }
        if (!formData.description?.trim()) {
          throw new Error("Description is required");
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const token = localStorage.getItem("accessToken");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const endpoint = isEditing
          ? `${apiUrl}/properties/${selectedItem?.id}`
          : `${apiUrl}/properties`;

        const body = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          address: formData.address.trim(),
          price: formData.price,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          property_type: formData.property_type,
          furnishing: formData.furnishing,
          available_from: formData.available_from,
        };

        const response = await fetch(endpoint, {
          method: isEditing ? "PATCH" : "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Failed to ${isEditing ? "update" : "create"} property`
          );
        }

        // Show success toast for property
        const action = isEditing ? "updated" : "created";
        const propertyName = formData.title;

        addNotification(
          "success",
          `Property "${propertyName}" ${action} successfully!`
        );

        setShowModal(null);
        setSelectedItem(null);
        fetchData(false);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to ${isEditing ? "update" : "create"} property`;

        addNotification(
          "error",
          `${isEditing ? "Update" : "Creation"} failed: ${errorMessage}`
        );
        setError(errorMessage);
      } finally {
        setIsActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                {isEditing ? (
                  <Edit3 className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isEditing ? "Edit Property" : "Add Property"}
                </h2>
                <p className="text-slate-600 text-sm">
                  {isEditing
                    ? "Update property information"
                    : "Create a new property listing"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Property Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  placeholder="Enter property title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  placeholder="Enter property description"
                  rows={3}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  placeholder="Enter property address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Price (Monthly)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  placeholder="Monthly rent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Available From
                </label>
                <input
                  type="date"
                  value={formData.available_from}
                  onChange={(e) =>
                    setFormData({ ...formData, available_from: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bedrooms
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bedrooms: parseInt(e.target.value) || 1,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bathrooms
                </label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bathrooms: parseInt(e.target.value) || 1,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Property Type
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) =>
                    setFormData({ ...formData, property_type: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="flat">Flat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Furnishing
                </label>
                <select
                  value={formData.furnishing}
                  onChange={(e) =>
                    setFormData({ ...formData, furnishing: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                >
                  <option value="furnished">Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="part-furnished">Part Furnished</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
              >
                {isActionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isEditing ? "Updating..." : "Creating..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>
                      {isEditing ? "Update Property" : "Create Property"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddEditPreferencesModal = () => {
    const isEditing = showModal === "edit";
    const [formData, setFormData] = useState({
      primary_postcode: isEditing
        ? (selectedItem?.primary_postcode as string) || ""
        : "",
      secondary_location: isEditing
        ? (selectedItem?.secondary_location as string) || ""
        : "",
      min_price: isEditing ? (selectedItem?.min_price as number) || 1000 : 1000,
      max_price: isEditing ? (selectedItem?.max_price as number) || 5000 : 5000,
      min_bedrooms: isEditing ? (selectedItem?.min_bedrooms as number) || 1 : 1,
      max_bedrooms: isEditing ? (selectedItem?.max_bedrooms as number) || 3 : 3,
      property_type: isEditing
        ? (selectedItem?.property_type as string) || "any"
        : "any",
      furnishing: isEditing
        ? (selectedItem?.furnishing as string) || "any"
        : "any",
    });

    // Preferences modal is now handled within user detail modal
    return null;
    if (showModal === "edit" && !selectedItem) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem && isEditing) return;

      setIsActionLoading(true);

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const token = localStorage.getItem("accessToken");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const endpoint = isEditing
          ? `${apiUrl}/preferences/admin/${selectedItem?.user_id}`
          : `${apiUrl}/preferences`;

        const body = {
          primary_postcode: formData.primary_postcode.trim() || null,
          secondary_location: formData.secondary_location.trim() || null,
          min_price: formData.min_price,
          max_price: formData.max_price,
          min_bedrooms: formData.min_bedrooms,
          max_bedrooms: formData.max_bedrooms,
          property_type:
            formData.property_type === "any" ? null : formData.property_type,
          furnishing:
            formData.furnishing === "any" ? null : formData.furnishing,
        };

        const response = await fetch(endpoint, {
          method: isEditing ? "PUT" : "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Failed to ${isEditing ? "update" : "create"} preferences`
          );
        }

        // Show success toast for preferences
        const action = isEditing ? "updated" : "created";
        const userName = isEditing
          ? (selectedItem as unknown as PreferencesRow).user?.full_name ||
            (selectedItem as unknown as PreferencesRow).user?.email ||
            "User"
          : "User";

        addNotification(
          "success",
          `Preferences for "${userName}" ${action} successfully!`
        );

        setShowModal(null);
        setSelectedItem(null);
        fetchData(false);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to ${isEditing ? "update" : "create"} preferences`;

        addNotification(
          "error",
          `${isEditing ? "Update" : "Creation"} failed: ${errorMessage}`
        );
        setError(errorMessage);
      } finally {
        setIsActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                {isEditing ? (
                  <Edit3 className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isEditing ? "Edit Preferences" : "Add Preferences"}
                </h2>
                <p className="text-slate-600 text-sm">
                  {isEditing
                    ? "Update user preferences"
                    : "Create new preferences"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Primary Postcode
                </label>
                <input
                  type="text"
                  value={formData.primary_postcode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primary_postcode: e.target.value,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  placeholder="e.g., SW1A 1AA"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Secondary Location
                </label>
                <input
                  type="text"
                  value={formData.secondary_location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      secondary_location: e.target.value,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  placeholder="e.g., Central London"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Min Price (Monthly)
                </label>
                <input
                  type="number"
                  value={formData.min_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Max Price (Monthly)
                </label>
                <input
                  type="number"
                  value={formData.max_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Min Bedrooms
                </label>
                <input
                  type="number"
                  value={formData.min_bedrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_bedrooms: parseInt(e.target.value) || 1,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Max Bedrooms
                </label>
                <input
                  type="number"
                  value={formData.max_bedrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_bedrooms: parseInt(e.target.value) || 1,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Property Type
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) =>
                    setFormData({ ...formData, property_type: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                >
                  <option value="any">Any</option>
                  <option value="flats">Flats</option>
                  <option value="houses">Houses</option>
                  <option value="studio">Studio</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Furnishing
                </label>
                <select
                  value={formData.furnishing}
                  onChange={(e) =>
                    setFormData({ ...formData, furnishing: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                >
                  <option value="any">Any</option>
                  <option value="furnished">Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="part-furnished">Part Furnished</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
              >
                {isActionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isEditing ? "Updating..." : "Creating..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>
                      {isEditing ? "Update Preferences" : "Create Preferences"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const DeleteModal = () => {
    if (!selectedItem || showModal !== "delete") return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Delete {activeSection.slice(0, -1)}
                </h2>
                <p className="text-slate-600 text-sm">Permanent action</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-200 mb-6">
            <p className="text-slate-700 text-center">
              Are you sure you want to delete this {activeSection.slice(0, -1)}?
              <br />
              <span className="font-semibold text-red-600">
                This action cannot be undone.
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(null)}
              className="flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isActionLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-400/20 disabled:opacity-70"
            >
              {isActionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

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

    if (error) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-600 font-medium mb-2">Error loading data</p>
            <p className="text-slate-600">{error}</p>
            <button
              onClick={() => fetchData()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "users":
        return renderUsersSection();
      case "properties":
        return renderPropertiesSection();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 admin-panel">
      <DashboardHeader />

      <div className="flex">
        {renderSidebar()}
        <div className="flex-1 p-6 sm:p-8">{renderContent()}</div>
      </div>

      <ViewModal />
      {activeSection === "users" && <AddEditUserModal />}
      {activeSection === "properties" && <AddEditPropertyModal />}
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
