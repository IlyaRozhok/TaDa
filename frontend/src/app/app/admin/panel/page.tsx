"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import UniversalHeader from "../../../components/UniversalHeader";
import SimpleDashboardRouter from "../../../components/SimpleDashboardRouter";
import { useDebounce } from "../../../hooks/useDebounce";
import AdminNotifications from "../../../components/AdminNotifications";
import MediaManager from "../../../components/MediaManager";
import { PropertyMedia } from "../../../types";
import { propertyMediaAPI } from "../../../lib/api";
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
  Image as ImageIcon,
} from "lucide-react";

type AdminSection =
  | "users"
  | "properties"
  | "rs-properties"
  | "operators"
  | "residential-complexes";

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
  residential_complex_id?: string;
  property_media?: PropertyMedia[];
}

interface Operator {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  operatorProfile?: {
    full_name?: string;
    company_name?: string;
    phone?: string;
    business_address?: string;
  };
}

interface ResidentialComplex {
  id: string;
  name: string;
  address: string;
  description?: string;
  total_units?: number;
  year_built?: number;
  amenities?: string[];
  postcode?: string;
  city?: string;
  country?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  operator_id: string;
  created_at: string;
  operator?: Operator;
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
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  const [operators, setOperators] = useState<Operator[]>([]);
  const [residentialComplexes, setResidentialComplexes] = useState<
    ResidentialComplex[]
  >([]);
  const [allResidentialComplexes, setAllResidentialComplexes] = useState<
    ResidentialComplex[]
  >([]);
  const [allOperators, setAllOperators] = useState<Operator[]>([]);
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
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedPropertyForMedia, setSelectedPropertyForMedia] =
    useState<Property | null>(null);
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
      commute_location: preferences?.commute_location || "",
      commute_time_walk: preferences?.commute_time_walk || 0,
      commute_time_cycle: preferences?.commute_time_cycle || 0,
      commute_time_tube: preferences?.commute_time_tube || 0,
      move_in_date: preferences?.move_in_date || "",
      min_price: preferences?.min_price || 0,
      max_price: preferences?.max_price || 0,
      min_bedrooms: preferences?.min_bedrooms || 0,
      max_bedrooms: preferences?.max_bedrooms || 0,
      min_bathrooms: preferences?.min_bathrooms || 0,
      max_bathrooms: preferences?.max_bathrooms || 0,
      furnishing: preferences?.furnishing || "any",
      let_duration: preferences?.let_duration || "",
      property_type: preferences?.property_type || "any",
      building_style: preferences?.building_style || [],
      designer_furniture: preferences?.designer_furniture || false,
      house_shares: preferences?.house_shares || "",
      lifestyle_features: preferences?.lifestyle_features || [],
      social_features: preferences?.social_features || [],
      work_features: preferences?.work_features || [],
      convenience_features: preferences?.convenience_features || [],
      pet_friendly_features: preferences?.pet_friendly_features || [],
      luxury_features: preferences?.luxury_features || [],
      hobbies: preferences?.hobbies || [],
      ideal_living_environment: preferences?.ideal_living_environment || "",
      pets: preferences?.pets || "",
      smoker: preferences?.smoker || false,
      additional_info: preferences?.additional_info || "",
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
              <div className="space-y-6">
                {/* Location & Commute Section */}
                <div>
                  <h4 className="text-md font-semibold text-slate-800 mb-3">
                    Location & Commute
                  </h4>
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
                        Commute Location
                      </label>
                      <p className="text-slate-900">
                        {preferences.commute_location || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Move-in Date
                      </label>
                      <p className="text-slate-900">
                        {preferences.move_in_date || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commute Times Section */}
                <div>
                  <h4 className="text-md font-semibold text-slate-800 mb-3">
                    Commute Times
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Walk (min)
                      </label>
                      <p className="text-slate-900">
                        {preferences.commute_time_walk || 0}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Cycle (min)
                      </label>
                      <p className="text-slate-900">
                        {preferences.commute_time_cycle || 0}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Tube (min)
                      </label>
                      <p className="text-slate-900">
                        {preferences.commute_time_tube || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Property Requirements Section */}
                <div>
                  <h4 className="text-md font-semibold text-slate-800 mb-3">
                    Property Requirements
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Bathrooms
                      </label>
                      <p className="text-slate-900">
                        {preferences.min_bathrooms || 0} -{" "}
                        {preferences.max_bathrooms || 0}
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
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Let Duration
                      </label>
                      <p className="text-slate-900">
                        {preferences.let_duration || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features Section */}
                <div>
                  <h4 className="text-md font-semibold text-slate-800 mb-3">
                    Features & Preferences
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Building Style
                      </label>
                      <p className="text-slate-900">
                        {preferences.building_style?.length > 0
                          ? preferences.building_style.join(", ")
                          : "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Designer Furniture
                      </label>
                      <p className="text-slate-900">
                        {preferences.designer_furniture ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        House Shares
                      </label>
                      <p className="text-slate-900">
                        {preferences.house_shares || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Ideal Living Environment
                      </label>
                      <p className="text-slate-900">
                        {preferences.ideal_living_environment ||
                          "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lifestyle Features Section */}
                <div>
                  <h4 className="text-md font-semibold text-slate-800 mb-3">
                    Lifestyle Features
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Lifestyle Features
                      </label>
                      <p className="text-slate-900">
                        {preferences.lifestyle_features?.length > 0
                          ? preferences.lifestyle_features.join(", ")
                          : "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Social Features
                      </label>
                      <p className="text-slate-900">
                        {preferences.social_features?.length > 0
                          ? preferences.social_features.join(", ")
                          : "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Work Features
                      </label>
                      <p className="text-slate-900">
                        {preferences.work_features?.length > 0
                          ? preferences.work_features.join(", ")
                          : "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Convenience Features
                      </label>
                      <p className="text-slate-900">
                        {preferences.convenience_features?.length > 0
                          ? preferences.convenience_features.join(", ")
                          : "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Pet Friendly Features
                      </label>
                      <p className="text-slate-900">
                        {preferences.pet_friendly_features?.length > 0
                          ? preferences.pet_friendly_features.join(", ")
                          : "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Luxury Features
                      </label>
                      <p className="text-slate-900">
                        {preferences.luxury_features?.length > 0
                          ? preferences.luxury_features.join(", ")
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Preferences Section */}
                <div>
                  <h4 className="text-md font-semibold text-slate-800 mb-3">
                    Personal Preferences
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Hobbies
                      </label>
                      <p className="text-slate-900">
                        {preferences.hobbies?.length > 0
                          ? preferences.hobbies.join(", ")
                          : "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Pets
                      </label>
                      <p className="text-slate-900">
                        {preferences.pets || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Smoker
                      </label>
                      <p className="text-slate-900">
                        {preferences.smoker ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-slate-600">
                        Additional Info
                      </label>
                      <p className="text-slate-900">
                        {preferences.additional_info || "Not specified"}
                      </p>
                    </div>
                  </div>
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

            <div className="space-y-6">
              {/* Location & Commute Section */}
              <div>
                <h4 className="text-md font-semibold text-slate-800 mb-3">
                  Location & Commute
                </h4>
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
                      Commute Location
                    </label>
                    <input
                      type="text"
                      value={formData.commute_location}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commute_location: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Canary Wharf"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Move-in Date
                    </label>
                    <input
                      type="date"
                      value={formData.move_in_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          move_in_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Commute Times Section */}
              <div>
                <h4 className="text-md font-semibold text-slate-800 mb-3">
                  Commute Times (minutes)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Walk
                    </label>
                    <input
                      type="number"
                      value={formData.commute_time_walk}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commute_time_walk: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cycle
                    </label>
                    <input
                      type="number"
                      value={formData.commute_time_cycle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commute_time_cycle: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tube
                    </label>
                    <input
                      type="number"
                      value={formData.commute_time_tube}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commute_time_tube: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Property Requirements Section */}
              <div>
                <h4 className="text-md font-semibold text-slate-800 mb-3">
                  Property Requirements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Min Price (£)
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
                      Max Price (£)
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
                      Min Bathrooms
                    </label>
                    <input
                      type="number"
                      value={formData.min_bathrooms}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_bathrooms: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Max Bathrooms
                    </label>
                    <input
                      type="number"
                      value={formData.max_bathrooms}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_bathrooms: parseInt(e.target.value) || 0,
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
                        setFormData({
                          ...formData,
                          property_type: e.target.value,
                        })
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Let Duration
                    </label>
                    <input
                      type="text"
                      value={formData.let_duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          let_duration: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 12 months"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Preferences Section */}
              <div>
                <h4 className="text-md font-semibold text-slate-800 mb-3">
                  Additional Preferences
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      House Shares
                    </label>
                    <input
                      type="text"
                      value={formData.house_shares}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          house_shares: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Not interested"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ideal Living Environment
                    </label>
                    <input
                      type="text"
                      value={formData.ideal_living_environment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ideal_living_environment: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Quiet neighborhood"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Pets
                    </label>
                    <input
                      type="text"
                      value={formData.pets}
                      onChange={(e) =>
                        setFormData({ ...formData, pets: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Cat, Dog"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Additional Info
                    </label>
                    <textarea
                      value={formData.additional_info}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          additional_info: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any additional preferences or requirements..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Boolean Preferences Section */}
              <div>
                <h4 className="text-md font-semibold text-slate-800 mb-3">
                  Preferences
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="designer_furniture"
                      checked={formData.designer_furniture}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          designer_furniture: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="designer_furniture"
                      className="ml-2 text-sm font-medium text-slate-700"
                    >
                      Designer Furniture
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="smoker"
                      checked={formData.smoker}
                      onChange={(e) =>
                        setFormData({ ...formData, smoker: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="smoker"
                      className="ml-2 text-sm font-medium text-slate-700"
                    >
                      Smoker
                    </label>
                  </div>
                </div>
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
            if (usersData.users) {
              setUsers(usersData.users);
              setPagination((prev) => ({
                ...prev,
                total: usersData.total || 0,
                totalPages:
                  usersData.totalPages ||
                  Math.ceil((usersData.total || 0) / prev.limit),
              }));
            } else if (usersData.data) {
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
          case "operators":
            const operatorsResponse = await fetch(
              `${apiUrl}/residential-complexes/operators`,
              {
                headers,
              }
            );
            if (!operatorsResponse.ok)
              throw new Error("Failed to fetch operators");
            const operatorsData = await operatorsResponse.json();
            setOperators(operatorsData);
            setPagination((prev) => ({
              ...prev,
              total: operatorsData.length || 0,
              totalPages: Math.ceil((operatorsData.length || 0) / prev.limit),
            }));
            break;
          case "residential-complexes":
            const complexesResponse = await fetch(
              `${apiUrl}/residential-complexes?${params}`,
              {
                headers,
              }
            );
            if (!complexesResponse.ok)
              throw new Error("Failed to fetch residential complexes");
            const complexesData = await complexesResponse.json();
            setResidentialComplexes(complexesData);
            setPagination((prev) => ({
              ...prev,
              total: complexesData.length || 0,
              totalPages: Math.ceil((complexesData.length || 0) / prev.limit),
            }));
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
          case "rs-properties":
            // Fetch properties
            const rsPropertiesResponse = await fetch(
              `${apiUrl}/properties?${params}`,
              {
                headers,
              }
            );
            if (!rsPropertiesResponse.ok)
              throw new Error("Failed to fetch RS properties");
            const rsPropertiesData = await rsPropertiesResponse.json();

            // Fetch all residential complexes for display
            const allComplexesResponse = await fetch(
              `${apiUrl}/residential-complexes`,
              {
                headers,
              }
            );
            if (!allComplexesResponse.ok)
              throw new Error("Failed to fetch residential complexes");
            const allComplexesData = await allComplexesResponse.json();
            setAllResidentialComplexes(
              Array.isArray(allComplexesData) ? allComplexesData : []
            );

            // Fetch all operators for display
            const allOperatorsResponse = await fetch(
              `${apiUrl}/residential-complexes/operators`,
              {
                headers,
              }
            );
            if (!allOperatorsResponse.ok)
              throw new Error("Failed to fetch operators");
            const allOperatorsData = await allOperatorsResponse.json();
            setAllOperators(
              Array.isArray(allOperatorsData) ? allOperatorsData : []
            );

            if (rsPropertiesData.data) {
              // Filter properties that have residential_complex_id
              const filteredProperties = rsPropertiesData.data.filter(
                (property: Property) => property.residential_complex_id
              );
              setProperties(filteredProperties);
              setPagination((prev) => ({
                ...prev,
                total: filteredProperties.length,
                totalPages: Math.ceil(filteredProperties.length / prev.limit),
              }));
            } else {
              const propertiesArray = Array.isArray(rsPropertiesData)
                ? rsPropertiesData
                : [];
              // Filter properties that have residential_complex_id
              const filteredProperties = propertiesArray.filter(
                (property: Property) => property.residential_complex_id
              );
              setProperties(filteredProperties);
              setPagination((prev) => ({
                ...prev,
                total: filteredProperties.length,
                totalPages: Math.ceil(filteredProperties.length / prev.limit),
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

  const handleMediaEdit = (property: Property) => {
    console.log("📸 Opening media editor for property:", property);
    setSelectedPropertyForMedia(property);
    setShowMediaModal(true);
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
        case "rs-properties":
          endpoint = `${apiUrl}/properties/${selectedItem.id}`;
          break;
        case "operators":
          // Operators are users, so we delete them as users
          endpoint = `${apiUrl}/users/${selectedItem.id}`;
          break;
        case "residential-complexes":
          endpoint = `${apiUrl}/residential-complexes/${selectedItem.id}`;
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
          : activeSection === "rs-properties"
          ? "RS Property"
          : activeSection === "operators"
          ? "Operator"
          : activeSection === "residential-complexes"
          ? "Residential Complex"
          : "Preferences";
      const itemName =
        activeSection === "users"
          ? (selectedItem as unknown as User).full_name ||
            (selectedItem as unknown as User).email
          : activeSection === "properties" || activeSection === "rs-properties"
          ? (selectedItem as unknown as Property).title
          : activeSection === "operators"
          ? (selectedItem as unknown as Operator).operatorProfile
              ?.company_name ||
            (selectedItem as unknown as Operator).operatorProfile?.full_name ||
            (selectedItem as unknown as Operator).email
          : activeSection === "residential-complexes"
          ? (selectedItem as unknown as ResidentialComplex).name
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
          <button
            onClick={() => setActiveSection("rs-properties")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "rs-properties"
                ? "bg-violet-50 text-violet-700 border border-violet-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="font-medium">RS Properties</span>
          </button>
          <button
            onClick={() => setActiveSection("operators")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "operators"
                ? "bg-violet-50 text-violet-700 border border-violet-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Operators</span>
          </button>
          <button
            onClick={() => setActiveSection("residential-complexes")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "residential-complexes"
                ? "bg-violet-50 text-violet-700 border border-violet-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="font-medium">Res. Complexes</span>
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
        <div className="flex gap-3">
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">
                        No users found
                      </h3>
                      <p className="text-slate-600">
                        {searchTerm || Object.keys(filters).length > 0
                          ? "Try adjusting your search or filters"
                          : "No users have been registered yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
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
                          <div className="flex items-center gap-2">
                            <div
                              className="text-sm font-semibold text-slate-900 truncate"
                              title={user.full_name || "No name"}
                            >
                              {user.full_name || "No name"}
                            </div>
                            {/* Show warning icon for users with inconsistent data */}
                            {((user.role === "tenant" &&
                              (!user.tenantProfile || user.operatorProfile)) ||
                              (user.role === "operator" &&
                                (!user.operatorProfile ||
                                  user.tenantProfile ||
                                  user.preferences)) ||
                              (user.role === "admin" &&
                                (user.tenantProfile ||
                                  user.operatorProfile ||
                                  user.preferences))) && (
                              <div
                                className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center cursor-help"
                                title="User has inconsistent profile data."
                              >
                                <span className="text-yellow-600 text-xs font-bold">
                                  !
                                </span>
                              </div>
                            )}
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
                ))
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

  const renderPropertiesSection = () => {
    // Ensure properties is an array
    const propertiesArray = Array.isArray(properties) ? properties : [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">
              Properties Management
            </h3>
            <p className="text-slate-600">
              Manage property listings and details
            </p>
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
                        <SortButton
                          field="title"
                          label="Title"
                          compact={true}
                        />
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
                {propertiesArray.map((property) => (
                  <tr
                    key={property.id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-150 relative overflow-hidden shadow-sm"
                          onClick={() => handleMediaEdit(property)}
                          title="Click to edit photos"
                        >
                          {property.property_media &&
                          property.property_media.length > 0 ? (
                            <img
                              src={
                                property.property_media[0]?.url ||
                                property.property_media[0]?.s3_url ||
                                "/placeholder-property.jpg"
                              }
                              alt={property.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder-property.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
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
                          onClick={() => handleMediaEdit(property)}
                          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors duration-150"
                          title="Manage photos"
                        >
                          <ImageIcon className="w-4 h-4" />
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
  };

  const renderRSPropertiesSection = () => {
    // Ensure properties is an array
    const propertiesArray = Array.isArray(properties) ? properties : [];

    // Helper function to get residential complex name
    const getResidentialComplexName = (complexId: string | undefined) => {
      if (!complexId) return "Not Linked";
      const complex = allResidentialComplexes.find((c) => c.id === complexId);
      return complex ? complex.name : "Unknown Complex";
    };

    // Helper function to get operator name
    const getOperatorName = (complexId: string | undefined) => {
      if (!complexId) return "No Owner";
      const complex = allResidentialComplexes.find((c) => c.id === complexId);
      if (!complex || !complex.operator_id) return "No Owner";
      const operator = allOperators.find((o) => o.id === complex.operator_id);
      if (!operator) return "Unknown Owner";
      return (
        operator.operatorProfile?.company_name ||
        operator.operatorProfile?.full_name ||
        operator.email
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">
              RS Properties Management
            </h3>
            <p className="text-slate-600">
              Manage properties linked to residential complexes
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add RS Property</span>
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
                <col className="w-32" />
                <col className="w-32" />
              </colgroup>
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs">Property</div>
                      <div className="flex gap-2 text-xs">
                        <SortButton
                          field="title"
                          label="Title"
                          compact={true}
                        />
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
                    Residential Complex
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {propertiesArray.map((property) => (
                  <tr
                    key={property.id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-150 relative overflow-hidden shadow-sm"
                          onClick={() => handleMediaEdit(property)}
                          title="Click to edit photos"
                        >
                          {property.property_media &&
                          property.property_media.length > 0 ? (
                            <img
                              src={
                                property.property_media[0]?.url ||
                                property.property_media[0]?.s3_url ||
                                "/placeholder-property.jpg"
                              }
                              alt={property.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder-property.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getResidentialComplexName(
                          property.residential_complex_id
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {getOperatorName(property.residential_complex_id)}
                      </span>
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
                          onClick={() => handleMediaEdit(property)}
                          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors duration-150"
                          title="Manage photos"
                        >
                          <ImageIcon className="w-4 h-4" />
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
  };

  const renderOperatorsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">
            Operators Management
          </h3>
          <p className="text-slate-600 mt-1">
            View and manage all operators in the system
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white text-black rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search operators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Operators Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="full_name" label="Name" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="email" label="Email" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="company_name" label="Company" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="phone" label="Phone" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="status" label="Status" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="created_at" label="Created" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {operators
                .slice(
                  (pagination.page - 1) * pagination.limit,
                  pagination.page * pagination.limit
                )
                .map((operator) => (
                  <tr key={operator.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {operator.operatorProfile?.full_name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {operator.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {operator.operatorProfile?.company_name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {operator.operatorProfile?.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          operator.status === "active"
                            ? "bg-green-100 text-green-800"
                            : operator.status === "inactive"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {operator.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(operator.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(operator)}
                          className="text-violet-600 hover:text-violet-900 p-1 rounded"
                          title="View operator"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.totalPages ||
                          Math.abs(page - pagination.page) <= 2
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.page
                                ? "z-10 bg-violet-50 border-violet-500 text-violet-600"
                                : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderResidentialComplexesSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">
            Residential Complexes Management
          </h3>
          <p className="text-slate-600 mt-1">
            Manage all residential complexes in the system
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Complex
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white text-black rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search complexes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Complexes Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="name" label="Name" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="address" label="Address" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="total_units" label="Units" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="operator" label="Operator" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <SortButton field="created_at" label="Created" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {residentialComplexes
                .slice(
                  (pagination.page - 1) * pagination.limit,
                  pagination.page * pagination.limit
                )
                .map((complex) => (
                  <tr key={complex.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {complex.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {complex.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {complex.total_units || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {complex.operator?.operatorProfile?.company_name ||
                          complex.operator?.operatorProfile?.full_name ||
                          complex.operator?.email ||
                          "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(complex.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(complex)}
                          className="text-violet-600 hover:text-violet-900 p-1 rounded"
                          title="View complex"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(complex)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit complex"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(complex)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete complex"
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.totalPages ||
                          Math.abs(page - pagination.page) <= 2
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.page
                                ? "z-10 bg-violet-50 border-violet-500 text-violet-600"
                                : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
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
                {(selectedItem as any)?.role === "tenant" && (
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
                )}
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
                            (() => {
                              try {
                                return JSON.stringify(value, null, 2);
                              } catch (error) {
                                return `[Circular Reference: ${typeof value}]`;
                              }
                            })()
                          ) : (
                            String(value)
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (selectedItem as any)?.role === "tenant" ? (
                // Preferences tab - only for tenants
                <UserPreferencesTab
                  userId={(selectedItem as any).id}
                  preferences={userPreferences}
                  loading={preferencesLoading}
                  onPreferencesUpdate={() =>
                    fetchUserPreferences((selectedItem as any).id)
                  }
                />
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No Preferences Available
                  </h3>
                  <p className="text-slate-600">
                    Preferences are only available for tenant users.
                  </p>
                </div>
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

        if (isEditing) {
          // Check if role is being changed
          const originalRole = selectedItem?.role as string;
          const newRole = formData.role;

          if (originalRole !== newRole) {
            // Show warning about role change
            const confirmed = window.confirm(
              `Are you sure you want to change the user role from "${originalRole}" to "${newRole}"?\n\n` +
                `This will automatically:\n` +
                `• Remove the old profile (${originalRole} profile)\n` +
                `• Create a new profile (${newRole} profile)\n` +
                `• ${
                  newRole === "tenant"
                    ? "Create preferences"
                    : "Remove preferences"
                }\n\n` +
                `This action cannot be undone.`
            );

            if (!confirmed) {
              setIsActionLoading(false);
              return;
            }
          }

          // Update user data
          const updateData = {
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            ...(formData.phone?.trim() && { phone: formData.phone.trim() }),
          };

          // Update basic user info
          const userResponse = await fetch(
            `${apiUrl}/users/${selectedItem?.id}`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify(updateData),
            }
          );

          if (!userResponse.ok) {
            const errorData = await userResponse.json();
            throw new Error(errorData.message || "Failed to update user");
          }

          // If role is being changed, use the dedicated role update endpoint
          if (originalRole !== newRole) {
            const roleResponse = await fetch(
              `${apiUrl}/users/${selectedItem?.id}/role`,
              {
                method: "PUT",
                headers,
                body: JSON.stringify({ role: newRole }),
              }
            );

            if (!roleResponse.ok) {
              const errorData = await roleResponse.json();
              throw new Error(
                errorData.message || "Failed to update user role"
              );
            }

            addNotification(
              "success",
              `User "${formData.full_name}" role changed from "${originalRole}" to "${newRole}" successfully!`
            );
          } else {
            addNotification(
              "success",
              `User "${formData.full_name}" updated successfully!`
            );
          }
        } else {
          // Creating new user
          const endpoint = `${apiUrl}/users`;
          const body = {
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            role: formData.role,
            ...(formData.phone?.trim() && { phone: formData.phone.trim() }),
            password: formData.password || "defaultPassword123",
          };

          const response = await fetch(endpoint, {
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
            `User "${formData.full_name}" created successfully!`
          );
        }

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
      residential_complex_id: isEditing
        ? (selectedItem?.residential_complex_id as string) || ""
        : "",
    });

    if (
      !showModal ||
      (showModal !== "add" && showModal !== "edit") ||
      (activeSection !== "properties" && activeSection !== "rs-properties")
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
          ...(formData.residential_complex_id && {
            residential_complex_id: formData.residential_complex_id,
          }),
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Residential Complex (Optional)
                </label>
                <select
                  value={formData.residential_complex_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      residential_complex_id: e.target.value,
                    })
                  }
                  className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm"
                >
                  <option value="">
                    Select a residential complex (optional)
                  </option>
                  {residentialComplexes.map((complex) => (
                    <option key={complex.id} value={complex.id}>
                      {complex.name}
                    </option>
                  ))}
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

  const AddEditResidentialComplexModal = () => {
    const isEditing = showModal === "edit";
    const [formData, setFormData] = useState({
      name: isEditing ? (selectedItem?.name as string) || "" : "",
      address: isEditing ? (selectedItem?.address as string) || "" : "",
      description: isEditing ? (selectedItem?.description as string) || "" : "",
      total_units: isEditing ? (selectedItem?.total_units as number) || 0 : 0,
      year_built: isEditing
        ? (selectedItem?.year_built as number) || new Date().getFullYear()
        : new Date().getFullYear(),
      amenities: isEditing
        ? ((selectedItem?.amenities as string[]) || []).join(", ")
        : "",
      postcode: isEditing ? (selectedItem?.postcode as string) || "" : "",
      city: isEditing ? (selectedItem?.city as string) || "" : "",
      country: isEditing ? (selectedItem?.country as string) || "" : "",
      latitude: isEditing ? (selectedItem?.latitude as number) || 0 : 0,
      longitude: isEditing ? (selectedItem?.longitude as number) || 0 : 0,
      contact_phone: isEditing
        ? (selectedItem?.contact_phone as string) || ""
        : "",
      contact_email: isEditing
        ? (selectedItem?.contact_email as string) || ""
        : "",
      website: isEditing ? (selectedItem?.website as string) || "" : "",
      operator_id: isEditing ? (selectedItem?.operator_id as string) || "" : "",
    });

    if (
      !showModal ||
      (showModal !== "add" && showModal !== "edit") ||
      activeSection !== "residential-complexes"
    )
      return null;
    if (showModal === "edit" && !selectedItem) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem && isEditing) return;

      setIsActionLoading(true);

      try {
        if (!formData.name?.trim()) {
          throw new Error("Name is required");
        }
        if (!formData.address?.trim()) {
          throw new Error("Address is required");
        }
        if (!formData.operator_id) {
          throw new Error("Operator is required");
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const token = localStorage.getItem("accessToken");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const endpoint = isEditing
          ? `${apiUrl}/residential-complexes/${selectedItem?.id}`
          : `${apiUrl}/residential-complexes`;

        const amenitiesArray = formData.amenities
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a.length > 0);

        const body = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          description: formData.description?.trim() || undefined,
          total_units: formData.total_units || undefined,
          year_built: formData.year_built || undefined,
          amenities: amenitiesArray.length > 0 ? amenitiesArray : undefined,
          postcode: formData.postcode?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          country: formData.country?.trim() || undefined,
          latitude: formData.latitude || undefined,
          longitude: formData.longitude || undefined,
          contact_phone: formData.contact_phone?.trim() || undefined,
          contact_email: formData.contact_email?.trim() || undefined,
          website: formData.website?.trim() || undefined,
          operator_id: formData.operator_id,
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
              `Failed to ${isEditing ? "update" : "create"} residential complex`
          );
        }

        const action = isEditing ? "updated" : "created";
        const complexName = formData.name;

        addNotification(
          "success",
          `Residential Complex "${complexName}" ${action} successfully!`
        );

        setShowModal(null);
        setSelectedItem(null);
        fetchData(false);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to ${
                isEditing ? "update" : "create"
              } residential complex`;

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
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                {isEditing ? (
                  <Edit3 className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isEditing
                    ? "Edit Residential Complex"
                    : "Add Residential Complex"}
                </h2>
                <p className="text-slate-600 text-sm">
                  {isEditing
                    ? "Update residential complex information"
                    : "Create a new residential complex"}
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
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Complex Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., Sunset Gardens"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Operator <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.operator_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operator_id: e.target.value,
                      })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    required
                  >
                    <option value="">Select an operator</option>
                    {operators.map((operator) => (
                      <option key={operator.id} value={operator.id}>
                        {operator.operatorProfile?.company_name ||
                          operator.operatorProfile?.full_name ||
                          operator.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., 123 Sunset Boulevard, London"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., London"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={formData.postcode}
                    onChange={(e) =>
                      setFormData({ ...formData, postcode: e.target.value })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., SW1A 1AA"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., United Kingdom"
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
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    rows={3}
                    placeholder="Modern residential complex with luxury amenities..."
                  />
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
                Property Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Total Units
                  </label>
                  <input
                    type="number"
                    value={formData.total_units || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_units: parseInt(e.target.value) || 0,
                      })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., 150"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Year Built
                  </label>
                  <input
                    type="number"
                    value={formData.year_built || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year_built: parseInt(e.target.value) || 0,
                      })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., 2020"
                    min="1800"
                    max={new Date().getFullYear() + 5}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Amenities
                  </label>
                  <input
                    type="text"
                    value={formData.amenities}
                    onChange={(e) =>
                      setFormData({ ...formData, amenities: e.target.value })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., Gym, Swimming Pool, Parking, Concierge (comma separated)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Separate amenities with commas
                  </p>
                </div>
              </div>
            </div>

            {/* Location Coordinates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
                Location Coordinates
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        latitude: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., 51.5074"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        longitude: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., -0.1278"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_phone: e.target.value,
                      })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., +44 20 7123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_email: e.target.value,
                      })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., info@complex.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="text-black w-full px-4 py-3 bg-white/80 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-slate-400 transition-colors shadow-sm"
                    placeholder="e.g., https://complex.com"
                  />
                </div>
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
                className="flex-1 px-6 py-3 bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg disabled:opacity-70"
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
                      {isEditing ? "Update Complex" : "Create Complex"}
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
      case "rs-properties":
        return renderRSPropertiesSection();
      case "operators":
        return renderOperatorsSection();
      case "residential-complexes":
        return renderResidentialComplexesSection();
      default:
        return null;
    }
  };

  const MediaModal = () => {
    if (!showMediaModal || !selectedPropertyForMedia) return null;

    // Ensure we always display fresh media from backend (presigned URLs)
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [mediaList, setMediaList] = useState<PropertyMedia[]>(
      selectedPropertyForMedia.property_media || []
    );

    useEffect(() => {
      const fetchMedia = async () => {
        try {
          setLoadingMedia(true);
          console.log(
            "🖼️ Fetching media for property:",
            selectedPropertyForMedia.id
          );
          const fresh = await propertyMediaAPI.getPropertyMedia(
            selectedPropertyForMedia.id
          );
          console.log("🖼️ Fetched media:", fresh);
          setMediaList(fresh);
        } catch (e) {
          console.error("❌ Failed to fetch media:", e);
          // ignore, fallback to existing
        } finally {
          setLoadingMedia(false);
        }
      };

      fetchMedia();
    }, [selectedPropertyForMedia.id]);

    const handleMediaUpdate = (updatedMedia: PropertyMedia[]) => {
      // Update the property in the properties list
      setProperties((prev) =>
        prev.map((p) =>
          p.id === selectedPropertyForMedia.id
            ? { ...p, property_media: updatedMedia }
            : p
        )
      );
      setMediaList(updatedMedia);
    };

    console.log("🎭 Rendering MediaModal:", {
      showMediaModal,
      selectedPropertyForMedia,
      mediaList,
    });

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Manage Photos
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedPropertyForMedia.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Property ID: {selectedPropertyForMedia.id}
                </p>
              </div>
              <button
                onClick={() => {
                  console.log("🚪 Closing media modal");
                  setShowMediaModal(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {loadingMedia && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600">Loading photos...</span>
              </div>
            )}
            {!loadingMedia && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    📸 Total photos: {mediaList.length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Property ID: {selectedPropertyForMedia.id}
                  </p>
                </div>
                <MediaManager
                  propertyId={selectedPropertyForMedia.id}
                  media={mediaList}
                  accessToken={localStorage.getItem("accessToken") || ""}
                  onMediaUpdate={handleMediaUpdate}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 admin-panel">
      <UniversalHeader />

      <div className="flex">
        {renderSidebar()}
        <div className="flex-1 p-6 sm:p-8">{renderContent()}</div>
      </div>

      <ViewModal />
      {activeSection === "users" && <AddEditUserModal />}
      {activeSection === "properties" && <AddEditPropertyModal />}
      {activeSection === "rs-properties" && <AddEditPropertyModal />}
      {activeSection === "residential-complexes" && (
        <AddEditResidentialComplexModal />
      )}
      <DeleteModal />
      <MediaModal />

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
