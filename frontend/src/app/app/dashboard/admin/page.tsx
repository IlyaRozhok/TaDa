"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import DashboardHeader from "../../../components/DashboardHeader";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  clearCreateError,
  clearUpdateError,
  clearDeleteError,
  UserRow,
  CreateUserData,
  UpdateUserData,
} from "../../../store/slices/usersSlice";
import {
  fetchProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  clearCreateError as clearPropertyCreateError,
  clearUpdateError as clearPropertyUpdateError,
  clearDeleteError as clearPropertyDeleteError,
  PropertyRow,
  CreatePropertyData,
  UpdatePropertyData,
} from "../../../store/slices/propertiesSlice";
import {
  fetchAllPreferences,
  PreferencesRow,
  updateUserPreferences,
  clearUserPreferences,
} from "../../../store/slices/preferencesSlice";
import { useDebounce } from "../../../lib/utils";
import {
  Menu,
  Users as UsersIcon,
  UserCircle,
  Plus,
  X,
  Edit,
  Trash2,
  Building,
  Settings,
  Info,
} from "lucide-react";
import { AppDispatch, RootState } from "../../../store/store";

interface UsersState {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  updating: boolean;
  updateError: string | null;
  deleting: boolean;
  deleteError: string | null;
}

interface PropertiesState {
  properties: PropertyRow[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  updating: boolean;
  updateError: string | null;
  deleting: boolean;
  deleteError: string | null;
}

interface PreferencesState {
  preferences: PreferencesRow[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

// Create User Modal Component
function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState<CreateUserData>({
    full_name: "",
    email: "",
    password: "",
    roles: ["tenant"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({ ...prev, roles: [...prev.roles, role] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        roles: prev.roles.filter((r) => r !== role),
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password (min 6 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles
            </label>
            <div className="space-y-2">
              {["admin", "operator", "tenant"].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => handleRoleChange(role, e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.roles.length === 0}
              className="w-full px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Userok"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateUserData) => void;
  isLoading: boolean;
  error: string | null;
  user: UserRow | null;
}) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    roles: [] as string[],
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        roles: user.roles || [],
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onSubmit(user.id, formData);
    }
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({ ...prev, roles: [...prev.roles, role] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        roles: prev.roles.filter((r) => r !== role),
      }));
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles
            </label>
            <div className="space-y-2">
              {["admin", "operator", "tenant"].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => handleRoleChange(role, e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.roles.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Property Modal Component
function CreatePropertyModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  operators,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePropertyData) => void;
  isLoading: boolean;
  error: string | null;
  operators: UserRow[];
}) {
  const [formData, setFormData] = useState<CreatePropertyData>({
    title: "",
    description: "",
    address: "",
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    furnishing: "unfurnished",
    lifestyle_features: [],
    available_from: "",
    is_btr: false,
    operator_id: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleLifestyleFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        lifestyle_features: [...prev.lifestyle_features, feature],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        lifestyle_features: prev.lifestyle_features.filter(
          (f) => f !== feature
        ),
      }));
    }
  };

  if (!isOpen) return null;

  const lifestyleFeatures = [
    "gym",
    "pool",
    "concierge",
    "parking",
    "garden",
    "balcony",
    "pet-friendly",
    "wifi",
    "security",
    "lift",
    "storage",
    "laundry",
  ];

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Create New Property
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Property title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                required
                value={formData.property_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    property_type: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="room">Room</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Property description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Property address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (£)
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly rent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.bedrooms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bedrooms: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.bathrooms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bathrooms: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Furnishing
              </label>
              <select
                required
                value={formData.furnishing}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    furnishing: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="furnished">Furnished</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="part-furnished">Part-furnished</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available From
              </label>
              <input
                type="date"
                required
                value={formData.available_from}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    available_from: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator
              </label>
              <select
                required
                value={formData.operator_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    operator_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select operator</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.full_name} ({operator.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lifestyle Features
            </label>
            <div className="grid grid-cols-3 gap-2">
              {lifestyleFeatures.map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.lifestyle_features.includes(feature)}
                    onChange={(e) =>
                      handleLifestyleFeatureChange(feature, e.target.checked)
                    }
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_btr}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_btr: e.target.checked }))
                }
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Build-to-Rent (BTR) Property
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.operator_id}
              className="flex-1 px-4 py-2 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Property"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Property Modal Component
function EditPropertyModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  property,
  operators,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdatePropertyData) => void;
  isLoading: boolean;
  error: string | null;
  property: PropertyRow | null;
  operators: UserRow[];
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    furnishing: "unfurnished",
    lifestyle_features: [] as string[],
    available_from: "",
    is_btr: false,
    operator_id: "",
  });

  // Update form data when property changes
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description,
        address: property.address,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        property_type: property.property_type,
        furnishing: property.furnishing,
        lifestyle_features: property.lifestyle_features || [],
        available_from: property.available_from.split("T")[0], // Format date for input
        is_btr: property.is_btr,
        operator_id: property.operator_id,
      });
    }
  }, [property]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (property) {
      onSubmit(property.id, formData);
    }
  };

  const handleLifestyleFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        lifestyle_features: [...prev.lifestyle_features, feature],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        lifestyle_features: prev.lifestyle_features.filter(
          (f) => f !== feature
        ),
      }));
    }
  };

  if (!isOpen || !property) return null;

  const lifestyleFeatures = [
    "gym",
    "pool",
    "concierge",
    "parking",
    "garden",
    "balcony",
    "pet-friendly",
    "wifi",
    "security",
    "lift",
    "storage",
    "laundry",
  ];

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Property</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Property title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                required
                value={formData.property_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    property_type: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="room">Room</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Property description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Property address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (£)
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly rent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.bedrooms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bedrooms: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.bathrooms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bathrooms: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Furnishing
              </label>
              <select
                required
                value={formData.furnishing}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    furnishing: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="furnished">Furnished</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="part-furnished">Part-furnished</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available From
              </label>
              <input
                type="date"
                required
                value={formData.available_from}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    available_from: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator
              </label>
              <select
                required
                value={formData.operator_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    operator_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select operator</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.full_name} ({operator.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lifestyle Features
            </label>
            <div className="grid grid-cols-3 gap-2">
              {lifestyleFeatures.map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.lifestyle_features.includes(feature)}
                    onChange={(e) =>
                      handleLifestyleFeatureChange(feature, e.target.checked)
                    }
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_btr}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_btr: e.target.checked }))
                }
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Build-to-Rent (BTR) Property
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.operator_id}
              className="flex-1 px-4 py-2 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Property"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Property Confirmation Dialog Component
function DeletePropertyConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  property,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  property: PropertyRow | null;
}) {
  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Delete Property</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this property? This action cannot be
            undone.
          </p>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{property.title}</div>
              <div className="text-gray-600">{property.address}</div>
              <div className="text-gray-500 mt-1">
                £{property.price.toLocaleString()} • {property.bedrooms} bed •{" "}
                {property.bathrooms} bath
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Deleting...
              </>
            ) : (
              "Delete Property"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete User Confirmation Dialog Component
function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  user: UserRow | null;
}) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this user? This action cannot be
            undone.
          </p>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user.full_name}</div>
              <div className="text-gray-600">{user.email}</div>
              <div className="text-gray-500 mt-1">
                Roles: {user.roles?.join(", ")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Preferences Modal Component
interface PreferencesFormData {
  primary_postcode?: string;
  secondary_location?: string;
  commute_location?: string;
  commute_time_walk?: string;
  commute_time_cycle?: string;
  commute_time_tube?: string;
  move_in_date?: string;
  min_price?: string;
  max_price?: string;
  min_bedrooms?: string;
  max_bedrooms?: string;
  min_bathrooms?: string;
  max_bathrooms?: string;
  furnishing?: string;
  let_duration?: string;
  property_type?: string;
  house_shares?: string;
  date_property_added?: string;
  ideal_living_environment?: string;
  pets?: string;
  smoker?: boolean;
  additional_info?: string;
  lifestyle_features?: string[];
  social_features?: string[];
  work_features?: string[];
  convenience_features?: string[];
  pet_friendly_features?: string[];
  luxury_features?: string[];
  hobbies?: string[];
  building_style?: string[];
  designer_furniture?: boolean;
}

function EditPreferencesModal({
  isOpen,
  onClose,
  onSubmit,
  onClear,
  isLoading,
  preferences,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (preferences: Partial<PreferencesRow>) => void;
  onClear: () => void;
  isLoading: boolean;
  preferences: PreferencesRow | null;
}) {
  const [formData, setFormData] = useState<PreferencesFormData>({});

  useEffect(() => {
    if (preferences) {
      setFormData({
        primary_postcode: preferences.primary_postcode || "",
        secondary_location: preferences.secondary_location || "",
        commute_location: preferences.commute_location || "",
        commute_time_walk: preferences.commute_time_walk?.toString() || "",
        commute_time_cycle: preferences.commute_time_cycle?.toString() || "",
        commute_time_tube: preferences.commute_time_tube?.toString() || "",
        move_in_date: preferences.move_in_date || "",
        min_price: preferences.min_price?.toString() || "",
        max_price: preferences.max_price?.toString() || "",
        min_bedrooms: preferences.min_bedrooms?.toString() || "",
        max_bedrooms: preferences.max_bedrooms?.toString() || "",
        min_bathrooms: preferences.min_bathrooms?.toString() || "",
        max_bathrooms: preferences.max_bathrooms?.toString() || "",
        furnishing: preferences.furnishing || "",
        let_duration: preferences.let_duration || "",
        property_type: preferences.property_type || "",
        house_shares: preferences.house_shares || "",
        date_property_added: preferences.date_property_added || "",
        ideal_living_environment: preferences.ideal_living_environment || "",
        pets: preferences.pets || "",
        smoker: preferences.smoker || false,
        additional_info: preferences.additional_info || "",
        lifestyle_features: preferences.lifestyle_features || [],
        social_features: preferences.social_features || [],
        work_features: preferences.work_features || [],
        convenience_features: preferences.convenience_features || [],
        pet_friendly_features: preferences.pet_friendly_features || [],
        luxury_features: preferences.luxury_features || [],
        hobbies: preferences.hobbies || [],
        building_style: preferences.building_style || [],
        designer_furniture: preferences.designer_furniture || false,
      });
    }
  }, [preferences]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert string values to appropriate types and handle empty strings
    const submitData: Partial<PreferencesRow> = {
      primary_postcode: formData.primary_postcode?.trim()
        ? formData.primary_postcode.trim()
        : undefined,
      secondary_location: formData.secondary_location?.trim()
        ? formData.secondary_location.trim()
        : undefined,
      commute_location: formData.commute_location?.trim()
        ? formData.commute_location.trim()
        : undefined,
      move_in_date: formData.move_in_date?.trim()
        ? formData.move_in_date.trim()
        : undefined,
      furnishing: formData.furnishing?.trim()
        ? formData.furnishing.trim()
        : undefined,
      let_duration: formData.let_duration?.trim()
        ? formData.let_duration.trim()
        : undefined,
      property_type: formData.property_type?.trim()
        ? formData.property_type.trim()
        : undefined,
      house_shares: formData.house_shares?.trim()
        ? formData.house_shares.trim()
        : undefined,
      date_property_added: formData.date_property_added?.trim()
        ? formData.date_property_added.trim()
        : undefined,
      ideal_living_environment: formData.ideal_living_environment?.trim()
        ? formData.ideal_living_environment.trim()
        : undefined,
      pets: formData.pets?.trim() ? formData.pets.trim() : undefined,
      smoker: formData.smoker,
      additional_info: formData.additional_info?.trim()
        ? formData.additional_info.trim()
        : undefined,
      commute_time_walk: formData.commute_time_walk
        ? parseInt(formData.commute_time_walk)
        : undefined,
      commute_time_cycle: formData.commute_time_cycle
        ? parseInt(formData.commute_time_cycle)
        : undefined,
      commute_time_tube: formData.commute_time_tube
        ? parseInt(formData.commute_time_tube)
        : undefined,
      min_price: formData.min_price ? parseInt(formData.min_price) : undefined,
      max_price: formData.max_price ? parseInt(formData.max_price) : undefined,
      min_bedrooms: formData.min_bedrooms
        ? parseInt(formData.min_bedrooms)
        : undefined,
      max_bedrooms: formData.max_bedrooms
        ? parseInt(formData.max_bedrooms)
        : undefined,
      min_bathrooms: formData.min_bathrooms
        ? parseInt(formData.min_bathrooms)
        : undefined,
      max_bathrooms: formData.max_bathrooms
        ? parseInt(formData.max_bathrooms)
        : undefined,
      lifestyle_features: formData.lifestyle_features || [],
      social_features: formData.social_features || [],
      work_features: formData.work_features || [],
      convenience_features: formData.convenience_features || [],
      pet_friendly_features: formData.pet_friendly_features || [],
      luxury_features: formData.luxury_features || [],
      hobbies: formData.hobbies || [],
      building_style: formData.building_style || [],
      designer_furniture: formData.designer_furniture || false,
    };

    onSubmit(submitData);
  };

  const handleClear = () => {
    onClear();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Edit Preferences: {preferences?.user?.full_name || "User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Postcode
              </label>
              <input
                type="text"
                value={formData.primary_postcode || ""}
                onChange={(e) =>
                  setFormData({ ...formData, primary_postcode: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., SW1A 1AA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Location
              </label>
              <input
                type="text"
                value={formData.secondary_location || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    secondary_location: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Central London"
              />
            </div>
          </div>

          {/* Commute Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commute Location
              </label>
              <input
                type="text"
                value={formData.commute_location || ""}
                onChange={(e) =>
                  setFormData({ ...formData, commute_location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Canary Wharf"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Move In Date
              </label>
              <input
                type="date"
                value={formData.move_in_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, move_in_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Commute Times */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Walk Time (minutes)
              </label>
              <input
                type="number"
                value={formData.commute_time_walk || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commute_time_walk: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle Time (minutes)
              </label>
              <input
                type="number"
                value={formData.commute_time_cycle || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commute_time_cycle: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tube Time (minutes)
              </label>
              <input
                type="number"
                value={formData.commute_time_tube || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commute_time_tube: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price (£)
              </label>
              <input
                type="number"
                value={formData.min_price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_price: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price (£)
              </label>
              <input
                type="number"
                value={formData.max_price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_price: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          {/* Bedrooms and Bathrooms */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Bedrooms
              </label>
              <input
                type="number"
                value={formData.min_bedrooms || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_bedrooms: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Bedrooms
              </label>
              <input
                type="number"
                value={formData.max_bedrooms || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_bedrooms: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Bathrooms
              </label>
              <input
                type="number"
                value={formData.min_bathrooms || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_bathrooms: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Bathrooms
              </label>
              <input
                type="number"
                value={formData.max_bathrooms || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_bathrooms: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          {/* Property Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Furnishing
              </label>
              <select
                value={formData.furnishing || ""}
                onChange={(e) =>
                  setFormData({ ...formData, furnishing: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="furnished">Furnished</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="part-furnished">Part Furnished</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Let Duration
              </label>
              <select
                value={formData.let_duration || ""}
                onChange={(e) =>
                  setFormData({ ...formData, let_duration: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="6-months">6 Months</option>
                <option value="12-months">12 Months</option>
                <option value="18-months">18 Months</option>
                <option value="24-months">24 Months</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>

          {/* Property Type and House Shares */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={formData.property_type || ""}
                onChange={(e) =>
                  setFormData({ ...formData, property_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="any">Any</option>
                <option value="flats">Flats</option>
                <option value="houses">Houses</option>
                <option value="studio">Studio</option>
                <option value="others">Others</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                House Shares
              </label>
              <select
                value={formData.house_shares || ""}
                onChange={(e) =>
                  setFormData({ ...formData, house_shares: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="show-all">Show All</option>
                <option value="only-house-shares">Only House Shares</option>
                <option value="no-house-shares">No House Shares</option>
              </select>
            </div>
          </div>

          {/* Personal Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ideal Living Environment
              </label>
              <select
                value={formData.ideal_living_environment || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ideal_living_environment: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="quiet-professional">Quiet Professional</option>
                <option value="social-friendly">Social Friendly</option>
                <option value="family-oriented">Family Oriented</option>
                <option value="student-lifestyle">Student Lifestyle</option>
                <option value="creative-artistic">Creative Artistic</option>
                <option value="no-preference">No Preference</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pets
              </label>
              <select
                value={formData.pets || ""}
                onChange={(e) =>
                  setFormData({ ...formData, pets: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="none">None</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="small-pets">Small Pets</option>
                <option value="planning-to-get">Planning to Get</option>
              </select>
            </div>
          </div>

          {/* Smoker and Date Property Added */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Smoker
              </label>
              <select
                value={formData.smoker ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smoker: e.target.value === "true",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Property Added
              </label>
              <select
                value={formData.date_property_added || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date_property_added: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="any">Any</option>
                <option value="last-24-hours">Last 24 Hours</option>
                <option value="last-3-days">Last 3 Days</option>
                <option value="last-14-days">Last 14 Days</option>
                <option value="last-21-days">Last 21 Days</option>
              </select>
            </div>
          </div>

          {/* Designer Furniture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Designer Furniture
            </label>
            <select
              value={formData.designer_furniture ? "true" : "false"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  designer_furniture: e.target.value === "true",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          {/* Lifestyle Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lifestyle Features
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "gym",
                "pool",
                "concierge",
                "parking",
                "garden",
                "balcony",
                "pet-friendly",
                "wifi",
                "security",
                "lift",
                "storage",
                "laundry",
              ].map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.lifestyle_features?.includes(feature) || false
                    }
                    onChange={(e) => {
                      const features = formData.lifestyle_features || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          lifestyle_features: [...features, feature],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          lifestyle_features: features.filter(
                            (f) => f !== feature
                          ),
                        });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Social Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Social Features
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "communal-areas",
                "events",
                "networking",
                "co-working",
                "rooftop",
                "cinema",
                "games-room",
                "library",
              ].map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.social_features?.includes(feature) || false
                    }
                    onChange={(e) => {
                      const features = formData.social_features || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          social_features: [...features, feature],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          social_features: features.filter(
                            (f) => f !== feature
                          ),
                        });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature.replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Work Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Features
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "home-office",
                "meeting-rooms",
                "high-speed-internet",
                "printing",
                "quiet-zones",
                "phone-booths",
              ].map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.work_features?.includes(feature) || false}
                    onChange={(e) => {
                      const features = formData.work_features || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          work_features: [...features, feature],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          work_features: features.filter((f) => f !== feature),
                        });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature.replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Convenience Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Convenience Features
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "24-7-access",
                "maintenance",
                "cleaning",
                "package-delivery",
                "grocery-delivery",
                "transport-links",
              ].map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.convenience_features?.includes(feature) || false
                    }
                    onChange={(e) => {
                      const features = formData.convenience_features || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          convenience_features: [...features, feature],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          convenience_features: features.filter(
                            (f) => f !== feature
                          ),
                        });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature.replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Pet Friendly Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pet Friendly Features
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "pet-wash",
                "dog-park",
                "pet-sitting",
                "vet-nearby",
                "pet-grooming",
                "pet-supplies",
              ].map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.pet_friendly_features?.includes(feature) || false
                    }
                    onChange={(e) => {
                      const features = formData.pet_friendly_features || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          pet_friendly_features: [...features, feature],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          pet_friendly_features: features.filter(
                            (f) => f !== feature
                          ),
                        });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature.replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Luxury Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Luxury Features
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "spa",
                "sauna",
                "wine-cellar",
                "valet",
                "private-dining",
                "terrace",
                "skyline-views",
                "premium-finishes",
              ].map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.luxury_features?.includes(feature) || false
                    }
                    onChange={(e) => {
                      const features = formData.luxury_features || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          luxury_features: [...features, feature],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          luxury_features: features.filter(
                            (f) => f !== feature
                          ),
                        });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature.replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hobbies
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "reading",
                "cooking",
                "music",
                "sports",
                "art",
                "gaming",
                "photography",
                "travel",
                "fitness",
                "yoga",
              ].map((hobby) => (
                <label key={hobby} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hobbies?.includes(hobby) || false}
                    onChange={(e) => {
                      const hobbies = formData.hobbies || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          hobbies: [...hobbies, hobby],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          hobbies: hobbies.filter((h) => h !== hobby),
                        });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {hobby}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Building Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "modern",
                "traditional",
                "industrial",
                "minimalist",
                "luxury",
                "eco-friendly",
                "historic",
                "contemporary",
              ].map((style) => (
                <label key={style} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.building_style?.includes(style) || false}
                    onChange={(e) => {
                      const styles = formData.building_style || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          building_style: [...styles, style],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          building_style: styles.filter((s) => s !== style),
                        });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {style.replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Information
            </label>
            <textarea
              value={formData.additional_info || ""}
              onChange={(e) =>
                setFormData({ ...formData, additional_info: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional information..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Clear All Preferences
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Clear Preferences Confirmation Dialog Component
function ClearPreferencesConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  preferences,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  preferences: PreferencesRow | null;
}) {
  if (!isOpen || !preferences) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Clear Preferences</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to clear all preferences for this user? This
            action cannot be undone.
          </p>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {preferences.user?.full_name || "Unknown User"}
                </p>
                <p className="text-sm text-gray-500">
                  {preferences.user?.email || "No email"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Clearing..." : "Clear Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}

// View Preferences Modal Component
function ViewPreferencesModal({
  isOpen,
  onClose,
  preferences,
}: {
  isOpen: boolean;
  onClose: () => void;
  preferences: PreferencesRow | null;
}) {
  if (!isOpen || !preferences) return null;

  const formatArray = (arr: string[] | null | undefined) => {
    if (!arr || arr.length === 0) return "None";
    return arr.join(", ");
  };

  const formatValue = (value: string | number | boolean | null | undefined) => {
    if (value === null || value === undefined || value === "") return "Not set";
    return value;
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            View Preferences: {preferences.user?.full_name || "User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-8">
          {/* User Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              User Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {preferences.user?.full_name || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {preferences.user?.email || "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Location Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Location Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Primary Postcode
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatValue(preferences.primary_postcode)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Secondary Location
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatValue(preferences.secondary_location)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Commute Location
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatValue(preferences.commute_location)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Move-in Date
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {preferences.move_in_date
                    ? new Date(preferences.move_in_date).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Commute Times */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Commute Times
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Walk Time (minutes)
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatValue(preferences.commute_time_walk)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cycle Time (minutes)
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatValue(preferences.commute_time_cycle)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tube Time (minutes)
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatValue(preferences.commute_time_tube)}
                </p>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Budget</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Min Price (£)
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {preferences.min_price
                    ? `£${preferences.min_price.toLocaleString()}`
                    : "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Price (£)
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {preferences.max_price
                    ? `£${preferences.max_price.toLocaleString()}`
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Property Requirements */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Property Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bedrooms
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {preferences.min_bedrooms && preferences.max_bedrooms
                    ? `${preferences.min_bedrooms} - ${preferences.max_bedrooms}`
                    : preferences.min_bedrooms
                    ? `${preferences.min_bedrooms}+`
                    : "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bathrooms
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {preferences.min_bathrooms && preferences.max_bathrooms
                    ? `${preferences.min_bathrooms} - ${preferences.max_bathrooms}`
                    : preferences.min_bathrooms
                    ? `${preferences.min_bathrooms}+`
                    : "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Property Type
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {formatValue(preferences.property_type)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Furnishing
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {formatValue(preferences.furnishing)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Let Duration
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {formatValue(preferences.let_duration)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  House Shares
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {formatValue(preferences.house_shares)}
                </p>
              </div>
            </div>
          </div>

          {/* Lifestyle Features */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Lifestyle Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lifestyle Features
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatArray(preferences.lifestyle_features)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Social Features
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatArray(preferences.social_features)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Work Features
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatArray(preferences.work_features)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Convenience Features
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatArray(preferences.convenience_features)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pet-Friendly Features
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatArray(preferences.pet_friendly_features)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Luxury Features
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatArray(preferences.luxury_features)}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Personal Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ideal Living Environment
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {formatValue(preferences.ideal_living_environment)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pets
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {formatValue(preferences.pets)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Smoker
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {preferences.smoker ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hobbies
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatArray(preferences.hobbies)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Style
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatArray(preferences.building_style)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Designer Furniture
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {preferences.designer_furniture ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {preferences.additional_info && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Additional Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">
                  {preferences.additional_info}
                </p>
              </div>
            </div>
          )}

          {/* Other Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Other Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date Property Added Filter
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {formatValue(preferences.date_property_added)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 mt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const usersState = useSelector(
    (state: RootState) => state.users
  ) as UsersState;
  const propertiesState = useSelector(
    (state: RootState) => state.properties
  ) as PropertiesState;
  const preferencesState = useSelector(
    (state: RootState) => state.preferences
  ) as PreferencesState;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [showCreatePropertyModal, setShowCreatePropertyModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showDeletePropertyDialog, setShowDeletePropertyDialog] =
    useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyRow | null>(
    null
  );
  const [showEditPreferencesModal, setShowEditPreferencesModal] =
    useState(false);
  const [selectedPreferences, setSelectedPreferences] =
    useState<PreferencesRow | null>(null);
  const [showClearPreferencesDialog, setShowClearPreferencesDialog] =
    useState(false);
  const [showViewPreferencesModal, setShowViewPreferencesModal] =
    useState(false);
  const [operators, setOperators] = useState<UserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounced search with 400ms delay
  const debouncedSearch = useDebounce(search, 400);

  // Wait for SessionManager to initialize
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkInitialization = () => {
      // Check if SessionManager has been initialized
      if (typeof window !== "undefined" && window.__sessionManagerInitialized) {
        console.log("Admin page: SessionManager initialized");
        setIsInitialized(true);

        // Test API connection
        const testAPI = async () => {
          const token = localStorage.getItem("accessToken");
          const API_BASE_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

          console.log("Admin page: Testing API connection", {
            API_BASE_URL,
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 20) + "..." : "none",
          });

          if (token) {
            try {
              const response = await fetch(
                `${API_BASE_URL}/users?page=1&limit=1`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              console.log("Admin page: API test response:", {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText,
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error("Admin page: API test failed:", errorText);
              }
            } catch (error) {
              console.error("Admin page: API test network error:", error);
            }
          }
        };

        testAPI();
      } else {
        // Wait a bit more and check again
        timeoutId = setTimeout(checkInitialization, 100);
      }
    };

    checkInitialization();

    // Fallback: if not initialized after 5 seconds, force initialization
    const fallbackTimeout = setTimeout(() => {
      console.warn("Admin page: Forcing initialization after timeout");
      setIsInitialized(true);
    }, 5000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  // Simple access control
  useEffect(() => {
    if (!isInitialized) return;

    console.log("Admin page: Checking access", { isAuthenticated, user });

    if (isAuthenticated === false) {
      router.replace("/app/auth/login");
      return;
    }

    if (isAuthenticated && user && !user.roles?.includes("admin")) {
      if (user.roles?.includes("operator")) {
        router.replace("/app/dashboard/operator");
      } else {
        router.replace("/app/dashboard/tenant");
      }
      return;
    }
  }, [isAuthenticated, user, router, isInitialized]);

  // Fetch users when component mounts or search changes
  useEffect(() => {
    if (!isInitialized) return;

    console.log("Admin page: useEffect triggered", {
      isInitialized,
      isAuthenticated,
      user: user ? { id: user.id, roles: user.roles } : null,
      debouncedSearch,
      usersLoading: usersState.loading,
      usersError: usersState.error,
    });

    // Log the Redux auth state to debug
    const authState = JSON.parse(localStorage.getItem("persist:auth") || "{}");
    console.log("Admin page: Auth state from localStorage:", authState);

    if (isAuthenticated === true && user && user.roles?.includes("admin")) {
      console.log(
        "Admin page: Dispatching fetchUsers with search:",
        debouncedSearch
      );

      // Log the current Redux state before dispatching
      console.log("Admin page: Current Redux state:", {
        auth: {
          isAuthenticated,
          user: user ? { id: user.id, roles: user.roles } : null,
          hasToken: !!localStorage.getItem("accessToken"),
        },
        users: {
          loading: usersState.loading,
          error: usersState.error,
          usersCount: usersState.users.length,
        },
      });

      if (activeTab === "users") {
        console.log("Admin page: Fetching users");
        dispatch(
          fetchUsers({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
          })
        );
      } else if (activeTab === "properties") {
        console.log("Admin page: Fetching properties");
        dispatch(
          fetchProperties({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
          })
        );
      } else if (activeTab === "preferences") {
        console.log("Admin page: Fetching preferences");
        dispatch(
          fetchAllPreferences({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
          })
        );
      }
    } else {
      console.log("Admin page: Not fetching users because:", {
        isAuthenticated,
        hasUser: !!user,
        isAdmin: user?.roles?.includes("admin"),
        userRoles: user?.roles || [],
      });
    }
  }, [
    isAuthenticated,
    user,
    debouncedSearch,
    dispatch,
    isInitialized,
    activeTab,
  ]);

  // Diagnostic effect to monitor loading state changes
  useEffect(() => {
    console.log("Admin page: Loading state changed:", {
      loading: usersState.loading,
      error: usersState.error,
      usersCount: usersState.users.length,
      timestamp: new Date().toISOString(),
    });
  }, [usersState.loading, usersState.error, usersState.users.length]);

  // Show toast notifications for fetch errors
  useEffect(() => {
    if (usersState.error && !usersState.loading) {
      toast.error(`Failed to load users: ${usersState.error}`);
    }
  }, [usersState.error, usersState.loading]);

  useEffect(() => {
    if (propertiesState.error && !propertiesState.loading) {
      toast.error(`Failed to load properties: ${propertiesState.error}`);
    }
  }, [propertiesState.error, propertiesState.loading]);

  useEffect(() => {
    if (preferencesState.error && !preferencesState.loading) {
      toast.error(`Failed to load preferences: ${preferencesState.error}`);
    }
  }, [preferencesState.error, preferencesState.loading]);

  // Handle create user
  const handleCreateUser = (userData: CreateUserData) => {
    dispatch(createUser(userData)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setShowCreateModal(false);
        toast.success("User created successfully!");
        // Refresh users list
        dispatch(
          fetchUsers({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
          })
        );
      } else if (result.meta.requestStatus === "rejected") {
        toast.error((result.payload as string) || "Failed to create user");
      }
    });
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowCreateModal(false);
    dispatch(clearCreateError());
  };

  // Handle edit user
  const handleEditUser = (user: UserRow) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = (id: string, userData: UpdateUserData) => {
    dispatch(updateUser({ id, userData })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setShowEditModal(false);
        setSelectedUser(null);
        toast.success("User updated successfully!");
        // Refresh users list
        dispatch(
          fetchUsers({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
          })
        );
      } else if (result.meta.requestStatus === "rejected") {
        toast.error((result.payload as string) || "Failed to update user");
      }
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    dispatch(clearUpdateError());
  };

  // Handle delete user
  const handleDeleteUser = (user: UserRow) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      dispatch(deleteUser(selectedUser.id)).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          setShowDeleteDialog(false);
          setSelectedUser(null);
          toast.success("User deleted successfully!");
          // Refresh users list
          dispatch(
            fetchUsers({
              page: 1,
              limit: 50,
              search: debouncedSearch || undefined,
            })
          );
        } else if (result.meta.requestStatus === "rejected") {
          toast.error((result.payload as string) || "Failed to delete user");
        }
      });
    }
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setSelectedUser(null);
    dispatch(clearDeleteError());
  };

  // Property handlers
  const handleCreateProperty = (propertyData: CreatePropertyData) => {
    dispatch(createProperty(propertyData)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setShowCreatePropertyModal(false);
        toast.success("Property created successfully!");
        // Refresh properties list
        dispatch(
          fetchProperties({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
          })
        );
      } else if (result.meta.requestStatus === "rejected") {
        toast.error((result.payload as string) || "Failed to create property");
      }
    });
  };

  const handleCloseCreatePropertyModal = () => {
    setShowCreatePropertyModal(false);
    dispatch(clearPropertyCreateError());
  };

  const handleEditProperty = (property: PropertyRow) => {
    setSelectedProperty(property);
    setShowEditPropertyModal(true);
  };

  const handleUpdateProperty = (
    id: string,
    propertyData: UpdatePropertyData
  ) => {
    dispatch(updateProperty({ id, propertyData })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setShowEditPropertyModal(false);
        setSelectedProperty(null);
        toast.success("Property updated successfully!");
        // Refresh properties list
        dispatch(
          fetchProperties({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
          })
        );
      } else if (result.meta.requestStatus === "rejected") {
        toast.error((result.payload as string) || "Failed to update property");
      }
    });
  };

  const handleCloseEditPropertyModal = () => {
    setShowEditPropertyModal(false);
    setSelectedProperty(null);
    dispatch(clearPropertyUpdateError());
  };

  const handleDeleteProperty = (property: PropertyRow) => {
    setSelectedProperty(property);
    setShowDeletePropertyDialog(true);
  };

  const handleConfirmDeleteProperty = () => {
    if (selectedProperty) {
      dispatch(deleteProperty(selectedProperty.id)).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          setShowDeletePropertyDialog(false);
          setSelectedProperty(null);
          toast.success("Property deleted successfully!");
          // Refresh properties list
          dispatch(
            fetchProperties({
              page: 1,
              limit: 50,
              search: debouncedSearch || undefined,
            })
          );
        } else if (result.meta.requestStatus === "rejected") {
          toast.error(
            (result.payload as string) || "Failed to delete property"
          );
        }
      });
    }
  };

  const handleCloseDeletePropertyDialog = () => {
    setShowDeletePropertyDialog(false);
    setSelectedProperty(null);
    dispatch(clearPropertyDeleteError());
  };

  // Preferences handlers
  const handleEditPreferences = (preferences: PreferencesRow) => {
    setSelectedPreferences(preferences);
    setShowEditPreferencesModal(true);
  };

  const handleUpdatePreferences = (
    userId: string,
    preferencesData: Partial<PreferencesRow>
  ) => {
    dispatch(
      updateUserPreferences({ userId, preferences: preferencesData })
    ).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setShowEditPreferencesModal(false);
        setSelectedPreferences(null);
        toast.success("Preferences updated successfully!");
        // Refresh preferences list
        dispatch(
          fetchAllPreferences({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
          })
        );
      } else if (result.meta.requestStatus === "rejected") {
        toast.error(
          (result.payload as string) || "Failed to update preferences"
        );
      }
    });
  };

  const handleClearPreferences = (preferences: PreferencesRow) => {
    setSelectedPreferences(preferences);
    setShowClearPreferencesDialog(true);
  };

  const handleConfirmClearPreferences = () => {
    if (selectedPreferences) {
      dispatch(
        clearUserPreferences({ userId: selectedPreferences.user_id })
      ).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          setShowClearPreferencesDialog(false);
          setSelectedPreferences(null);
          toast.success("Preferences cleared successfully!");
          // Refresh preferences list
          dispatch(
            fetchAllPreferences({
              page: 1,
              limit: 50,
              search: debouncedSearch || undefined,
            })
          );
        } else if (result.meta.requestStatus === "rejected") {
          toast.error(
            (result.payload as string) || "Failed to clear preferences"
          );
        }
      });
    }
  };

  const handleCloseClearPreferencesDialog = () => {
    setShowClearPreferencesDialog(false);
    setSelectedPreferences(null);
  };

  const handleCloseEditPreferencesModal = () => {
    setShowEditPreferencesModal(false);
    setSelectedPreferences(null);
  };

  const handleViewPreferences = (preferences: PreferencesRow) => {
    setSelectedPreferences(preferences);
    setShowViewPreferencesModal(true);
  };

  const handleCloseViewPreferencesModal = () => {
    setShowViewPreferencesModal(false);
    setSelectedPreferences(null);
  };

  // Fetch operators for property forms
  const fetchOperators = () => {
    dispatch(fetchUsers({ page: 1, limit: 100 })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        const allUsers = result.payload.data || [];
        const operatorUsers = allUsers.filter((user: UserRow) =>
          user.roles?.includes("operator")
        );
        setOperators(operatorUsers);
      }
    });
  };

  // Fetch operators when component mounts
  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.roles?.includes("admin")) {
      fetchOperators();
    }
  }, [isInitialized, isAuthenticated, user]);

  // Show loading while checking access or initializing
  if (!isInitialized) {
    console.log("Admin page: Showing loading screen - not initialized");

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading administrator panel...</p>
          <p className="text-sm text-slate-400 mt-2">Initializing session...</p>
          <p className="text-xs text-slate-300 mt-2">
            Debug: init={String(isInitialized)}, auth={String(isAuthenticated)},
            user={user ? "present" : "null"}, admin=
            {user && user.roles?.includes("admin") ? "yes" : "no"}
          </p>
        </div>
      </div>
    );
  }

  // After initialization, check authentication and permissions
  if (isAuthenticated === false) {
    console.log("Admin page: Not authenticated, redirecting to login");
    router.replace("/app/auth/login");
    return null;
  }

  if (isAuthenticated === true && user && !user.roles?.includes("admin")) {
    console.log("Admin page: User is not admin, showing access denied");

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access the admin panel.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Your current roles:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {user.roles?.map((role, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                if (user.roles?.includes("operator")) {
                  router.replace("/app/dashboard/operator");
                } else {
                  router.replace("/app/dashboard/tenant");
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to My Dashboard
            </button>

            <button
              onClick={() => router.replace("/app/auth/login")}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Contact administrator if you need admin access
          </p>
        </div>
      </div>
    );
  }

  // Still loading user data
  if (isAuthenticated === true && !user) {
    console.log("Admin page: Authenticated but no user data yet");

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading administrator panel...</p>
          <p className="text-sm text-slate-400 mt-2">Loading user data...</p>
          <p className="text-xs text-slate-300 mt-2">
            Debug: init={String(isInitialized)}, auth={String(isAuthenticated)},
            user={user ? "present" : "null"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <DashboardHeader />
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`transition-all duration-200 h-screen sticky top-0 z-40 flex flex-col justify-between ${
            sidebarOpen ? "w-[240px]" : "w-16"
          }`}
          style={{
            background: "#f8fafc",
            borderRight: "1px solid #e5e7eb",
            boxShadow: sidebarOpen ? "2px 0 8px 0 #e5e7eb33" : "none",
          }}
        >
          <div>
            {/* Header with burger menu */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
              <button
                className="p-2 rounded hover:bg-blue-100 transition-colors"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            {/* Nav */}
            <nav className="mt-4 flex flex-col gap-1">
              <button
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all font-medium text-base w-full
                ${
                  activeTab === "users"
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
                onClick={() => setActiveTab("users")}
              >
                <UsersIcon
                  className={`w-5 h-5 ${
                    activeTab === "users" ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                {sidebarOpen && <span>Users</span>}
              </button>
              <button
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all font-medium text-base w-full
                ${
                  activeTab === "properties"
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
                onClick={() => setActiveTab("properties")}
              >
                <Building
                  className={`w-5 h-5 ${
                    activeTab === "properties"
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
                {sidebarOpen && <span>Properties</span>}
              </button>
              <button
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all font-medium text-base w-full
                ${
                  activeTab === "preferences"
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
                onClick={() => setActiveTab("preferences")}
              >
                <Settings
                  className={`w-5 h-5 ${
                    activeTab === "preferences"
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
                {sidebarOpen && <span>Preferences</span>}
              </button>
            </nav>
          </div>
          {/* User avatar bottom */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2 border border-gray-300">
              <UserCircle className="w-7 h-7 text-gray-500" />
            </div>
            {sidebarOpen && user && (
              <div className="text-xs text-gray-500 text-center max-w-[90%] truncate">
                {user.full_name}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-white text-black">
          <h1 className="text-2xl font-bold mb-6">Administrator Panel</h1>
          {activeTab === "users" && (
            <div>
              {/* Controls Row: Search, Filter and Create Button */}
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="font-semibold text-lg">Users</div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="operator">Operator</option>
                    <option value="tenant">Tenant</option>
                  </select>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
                  >
                    <Plus className="w-4 h-4" />
                    Create User
                  </button>
                </div>
              </div>

              {/* Error message */}
              {usersState.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  Error: {usersState.error}
                </div>
              )}

              {/* Table with fixed height */}
              <div className="overflow-x-auto bg-white rounded-xl shadow border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-64">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-80">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-48">
                        Roles
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-48">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {usersState.users && usersState.users.length > 0 ? (
                      usersState.users
                        .filter((u: UserRow) => {
                          if (roleFilter === "all") return true;
                          return u.roles?.includes(roleFilter);
                        })
                        .map((u: UserRow) => (
                          <tr
                            key={u.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-4 whitespace-nowrap w-64">
                              <div className="text-base font-medium text-gray-900 truncate">
                                {u.full_name}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-80">
                              <div className="text-base text-gray-900 truncate">
                                {u.email}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-48">
                              <div className="text-base text-gray-900 truncate">
                                {u.roles?.join(", ")}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-48">
                              <div className="text-base text-gray-900 truncate">
                                {new Date(u.created_at).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-32">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditUser(u)}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit user"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-16">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <UsersIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {usersState.loading
                                ? "Loading users..."
                                : "No users found"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {usersState.loading
                                ? "Please wait while we fetch the user data"
                                : search || roleFilter !== "all"
                                ? "Try adjusting your search criteria or role filter"
                                : "No users are available in the system"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Results info */}
              {usersState.users && usersState.users.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div>
                    Showing{" "}
                    {
                      usersState.users.filter((u: UserRow) => {
                        if (roleFilter === "all") return true;
                        return u.roles?.includes(roleFilter);
                      }).length
                    }{" "}
                    of {usersState.total} users
                    {roleFilter !== "all" && (
                      <span className="ml-2 text-blue-600">
                        (filtered by {roleFilter} role)
                      </span>
                    )}
                  </div>
                  {search && (
                    <div>
                      Search results for:{" "}
                      <span className="font-medium">&quot;{search}&quot;</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "properties" && (
            <div>
              {/* Controls Row: Search and Create Button */}
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="font-semibold text-lg">Properties</div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setShowCreatePropertyModal(true)}
                    className="px-4 py-2 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
                  >
                    <Plus className="w-4 h-4" />
                    Create Property
                  </button>
                </div>
              </div>

              {/* Error message */}
              {propertiesState.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  Error: {propertiesState.error}
                </div>
              )}

              {/* Properties Table */}
              <div className="overflow-x-auto bg-white rounded-xl shadow border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-80">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-64">
                        Address
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-24">
                        Beds
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-24">
                        Baths
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {propertiesState.properties &&
                    propertiesState.properties.length > 0 ? (
                      propertiesState.properties.map(
                        (property: PropertyRow) => (
                          <tr
                            key={property.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-4 whitespace-nowrap w-80">
                              <div className="text-base font-medium text-gray-900 truncate">
                                {property.title}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-64">
                              <div className="text-base text-gray-900 truncate">
                                {property.address}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-32">
                              <div className="text-base text-gray-900">
                                £{property.price.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-24">
                              <div className="text-base text-gray-900">
                                {property.bedrooms}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-24">
                              <div className="text-base text-gray-900">
                                {property.bathrooms}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-32">
                              <div className="text-base text-gray-900 truncate capitalize">
                                {property.property_type}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-32">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditProperty(property)}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit property"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProperty(property)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Delete property"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-16">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Building className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {propertiesState.loading
                                ? "Loading properties..."
                                : "No properties found"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {propertiesState.loading
                                ? "Please wait while we fetch the property data"
                                : search
                                ? "Try adjusting your search criteria"
                                : "No properties are available in the system"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Results info */}
              {propertiesState.properties &&
                propertiesState.properties.length > 0 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div>
                      Showing {propertiesState.properties.length} of{" "}
                      {propertiesState.total} properties
                    </div>
                    {search && (
                      <div>
                        Search results for:{" "}
                        <span className="font-medium">
                          &quot;{search}&quot;
                        </span>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {activeTab === "preferences" && (
            <div>
              {/* Controls Row: Search */}
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="font-semibold text-lg">
                  Tenant&apos;s Preferences
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search users or preferences..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Error message */}
              {preferencesState.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  Error: {preferencesState.error}
                </div>
              )}

              {/* Preferences Table */}
              <div className="overflow-x-auto bg-white rounded-xl shadow border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-48">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Budget
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Property Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-24">
                        Beds
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Locations
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Lifestyle
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Move-in Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {preferencesState.preferences &&
                    preferencesState.preferences.length > 0 ? (
                      preferencesState.preferences.map((preference) => (
                        <tr
                          key={preference.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-4 whitespace-nowrap w-48">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">
                                {preference.user?.full_name || "Unknown User"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {preference.user?.email || "No email"}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap w-32">
                            <div className="text-sm text-gray-900">
                              {preference.min_price && preference.max_price ? (
                                <>
                                  £{preference.min_price.toLocaleString()} - £
                                  {preference.max_price.toLocaleString()}
                                </>
                              ) : (
                                <span className="text-gray-400">Not set</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap w-32">
                            <div className="text-sm text-gray-900 capitalize">
                              {preference.property_type || (
                                <span className="text-gray-400">Not set</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap w-24">
                            <div className="text-sm text-gray-900">
                              {preference.min_bedrooms &&
                              preference.max_bedrooms ? (
                                `${preference.min_bedrooms}-${preference.max_bedrooms}`
                              ) : preference.min_bedrooms ? (
                                `${preference.min_bedrooms}+`
                              ) : (
                                <span className="text-gray-400">Any</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 w-32">
                            <div className="text-sm text-gray-900">
                              <div className="flex flex-wrap gap-1">
                                {preference.primary_postcode && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {preference.primary_postcode}
                                  </span>
                                )}
                                {preference.secondary_location && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {preference.secondary_location}
                                  </span>
                                )}
                                {preference.commute_location && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    Work: {preference.commute_location}
                                  </span>
                                )}
                              </div>
                              {!preference.primary_postcode &&
                                !preference.secondary_location &&
                                !preference.commute_location && (
                                  <span className="text-gray-400">None</span>
                                )}
                            </div>
                          </td>
                          <td className="px-4 py-4 w-32">
                            <div className="text-sm text-gray-900">
                              {preference.lifestyle_features &&
                              preference.lifestyle_features.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {preference.lifestyle_features
                                    .slice(0, 2)
                                    .map((lifestyle: string, index: number) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                      >
                                        {lifestyle}
                                      </span>
                                    ))}
                                  {preference.lifestyle_features.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +
                                      {preference.lifestyle_features.length - 2}{" "}
                                      more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap w-32">
                            <div className="text-sm text-gray-900">
                              {preference.move_in_date
                                ? new Date(
                                    preference.move_in_date
                                  ).toLocaleDateString()
                                : "Flexible"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap w-32">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleViewPreferences(preference)
                                }
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                                title="View preferences"
                              >
                                <Info className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleEditPreferences(preference)
                                }
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                title="Edit preferences"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleClearPreferences(preference)
                                }
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Clear preferences"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-16">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Settings className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {preferencesState.loading
                                ? "Loading preferences..."
                                : "No preferences found"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {preferencesState.loading
                                ? "Please wait while we fetch the preferences data"
                                : search
                                ? "Try adjusting your search criteria"
                                : "No user preferences are available in the system"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Results info */}
              {preferencesState.preferences &&
                preferencesState.preferences.length > 0 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div>
                      Showing {preferencesState.preferences.length} of{" "}
                      {preferencesState.total} preferences
                    </div>
                    {search && (
                      <div>
                        Search results for:{" "}
                        <span className="font-medium">
                          &quot;{search}&quot;
                        </span>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Create User Modal */}
          <CreateUserModal
            isOpen={showCreateModal}
            onClose={handleCloseModal}
            onSubmit={handleCreateUser}
            isLoading={usersState.creating}
            error={usersState.createError}
          />

          {/* Edit User Modal */}
          <EditUserModal
            isOpen={showEditModal}
            onClose={handleCloseEditModal}
            onSubmit={handleUpdateUser}
            isLoading={usersState.updating}
            error={usersState.updateError}
            user={selectedUser}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            isOpen={showDeleteDialog}
            onClose={handleCloseDeleteDialog}
            onConfirm={handleConfirmDelete}
            isLoading={usersState.deleting}
            user={selectedUser}
          />

          {/* Create Property Modal */}
          <CreatePropertyModal
            isOpen={showCreatePropertyModal}
            onClose={handleCloseCreatePropertyModal}
            onSubmit={handleCreateProperty}
            isLoading={propertiesState.creating}
            error={propertiesState.createError}
            operators={operators}
          />

          {/* Edit Property Modal */}
          <EditPropertyModal
            isOpen={showEditPropertyModal}
            onClose={handleCloseEditPropertyModal}
            onSubmit={handleUpdateProperty}
            isLoading={propertiesState.updating}
            error={propertiesState.updateError}
            property={selectedProperty}
            operators={operators}
          />

          {/* Delete Property Confirmation Dialog */}
          <DeletePropertyConfirmationDialog
            isOpen={showDeletePropertyDialog}
            onClose={handleCloseDeletePropertyDialog}
            onConfirm={handleConfirmDeleteProperty}
            isLoading={propertiesState.deleting}
            property={selectedProperty}
          />

          {/* Edit Preferences Modal */}
          <EditPreferencesModal
            isOpen={showEditPreferencesModal}
            onClose={handleCloseEditPreferencesModal}
            onSubmit={(preferencesData) =>
              handleUpdatePreferences(
                selectedPreferences?.user_id || "",
                preferencesData
              )
            }
            onClear={() => {
              if (selectedPreferences) {
                handleClearPreferences(selectedPreferences);
              }
            }}
            isLoading={preferencesState.loading}
            preferences={selectedPreferences}
          />

          {/* Clear Preferences Confirmation Dialog */}
          <ClearPreferencesConfirmationDialog
            isOpen={showClearPreferencesDialog}
            onClose={handleCloseClearPreferencesDialog}
            onConfirm={handleConfirmClearPreferences}
            isLoading={preferencesState.loading}
            preferences={selectedPreferences}
          />

          {/* View Preferences Modal */}
          <ViewPreferencesModal
            isOpen={showViewPreferencesModal}
            onClose={handleCloseViewPreferencesModal}
            preferences={selectedPreferences}
          />
        </main>
      </div>
    </div>
  );
}
