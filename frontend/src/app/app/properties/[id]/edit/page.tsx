"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/store/hooks";
import { propertiesAPI, CreatePropertyRequest } from "@/app/lib/api";
import { Property, PropertyMedia } from "@/app/types";
import DashboardHeader from "../../../../components/DashboardHeader";
import MediaManager from "../../../../components/MediaManager";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Home,
  Building,
  Bed,
  Bath,
  Calendar,
  MapPin,
  DollarSign,
  Settings,
  Tag,
  Star,
  Wifi,
  Car,
  Dumbbell,
  Waves,
  Users,
  Shield,
  Zap,
  TreePine,
  Coffee,
  Utensils,
  Tv,
  Wind,
  Sparkles,
  Building2,
} from "lucide-react";

// Lifestyle features with icons
const lifestyleFeatures = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "pool", label: "Pool", icon: Waves },
  { id: "parking", label: "Parking", icon: Car },
  { id: "concierge", label: "Concierge", icon: Users },
  { id: "security", label: "Security", icon: Shield },
  { id: "garden", label: "Garden", icon: TreePine },
  { id: "terrace", label: "Terrace", icon: Building2 },
  { id: "balcony", label: "Balcony", icon: Building },
  { id: "dishwasher", label: "Dishwasher", icon: Utensils },
  { id: "laundry", label: "Laundry", icon: Sparkles },
  { id: "air_conditioning", label: "Air Conditioning", icon: Wind },
  { id: "heating", label: "Heating", icon: Zap },
  { id: "elevator", label: "Elevator", icon: Building2 },
  { id: "storage", label: "Storage", icon: Building },
  { id: "entertainment", label: "Entertainment", icon: Tv },
  { id: "coffee_machine", label: "Coffee Machine", icon: Coffee },
];

interface FormErrors {
  [key: string]: string;
}

export default function EditPropertyPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const [property, setProperty] = useState<Property | null>(null);
  const [media, setMedia] = useState<PropertyMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CreatePropertyRequest>({
    title: "",
    description: "",
    address: "",
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    furnishing: "furnished",
    lifestyle_features: [],
    available_from: "",
    is_btr: false,
  });

  // Load property data
  useEffect(() => {
    const loadProperty = async () => {
      if (!id || !accessToken) return;

      try {
        setLoading(true);
        setError(null);

        const propertyData = await propertiesAPI.getById(id as string);
        setProperty(propertyData);
        setMedia(propertyData.media || []);

        // Populate form with property data
        setFormData({
          title: propertyData.title || "",
          description: propertyData.description || "",
          address: propertyData.address || "",
          price: Number(propertyData.price) || 0,
          bedrooms: propertyData.bedrooms || 1,
          bathrooms: propertyData.bathrooms || 1,
          property_type: propertyData.property_type || "apartment",
          furnishing: propertyData.furnishing || "furnished",
          lifestyle_features: propertyData.lifestyle_features || [],
          available_from: propertyData.available_from
            ? propertyData.available_from.split("T")[0]
            : "",
          is_btr: propertyData.is_btr || false,
        });
      } catch (err: any) {
        console.error("Error loading property:", err);
        setError("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id, accessToken]);

  // Check user permissions
  useEffect(() => {
    if (!isAuthenticated || !user || !user.roles?.includes("operator")) {
      router.push("/app/dashboard/tenant");
      return;
    }

    if (property && property.operator_id !== user.id) {
      router.push("/app/dashboard/operator");
      return;
    }
  }, [isAuthenticated, user, property, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleLifestyleFeatureToggle = (featureId: string) => {
    setFormData((prev) => ({
      ...prev,
      lifestyle_features: prev.lifestyle_features?.includes(featureId)
        ? prev.lifestyle_features.filter((id) => id !== featureId)
        : [...(prev.lifestyle_features || []), featureId],
    }));
  };

  const handleMediaUpdate = (updatedMedia: PropertyMedia[]) => {
    setMedia(updatedMedia);
    // Also update the property media to keep it in sync
    if (property) {
      setProperty({ ...property, media: updatedMedia });
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    if (!formData.price || formData.price <= 0) {
      errors.price = "Price must be greater than 0";
    }

    if (!formData.available_from) {
      errors.available_from = "Available from date is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !property) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await propertiesAPI.update(property.id, formData);
      setSuccess("Property updated successfully!");

      // Redirect after success
      setTimeout(() => {
        router.push("/app/properties/manage");
      }, 2000);
    } catch (err: any) {
      console.error("Error updating property:", err);
      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const fieldErrors: FormErrors = {};
        Object.keys(backendErrors).forEach((field) => {
          fieldErrors[field] = Array.isArray(backendErrors[field])
            ? backendErrors[field][0]
            : backendErrors[field];
        });
        setFormErrors(fieldErrors);
      } else {
        setError(err.message || "Failed to update property");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user || !isAuthenticated || !accessToken) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading property details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error Loading Property
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push("/app/properties/manage")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to Properties
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/app/properties/manage")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Properties
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Property
              </h1>
              <p className="text-gray-600 mt-1">
                Update property details and manage media files
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Property Details */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Home className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Basic Information
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full text-slate-900 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.title ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="e.g., Modern 2-Bedroom Flat in Central London"
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full text-slate-900 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.description
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Describe your property..."
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full text-slate-900 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.address
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g., 123 Oxford Street, London W1D 2HX"
                    />
                    {formErrors.address && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Property Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Monthly Rent (£)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full text-slate-900 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.price ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="e.g., 2500"
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Available From
                    </label>
                    <input
                      type="date"
                      name="available_from"
                      value={formData.available_from}
                      onChange={handleInputChange}
                      className={`w-full text-slate-900 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.available_from
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    {formErrors.available_from && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.available_from}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Bed className="w-4 h-4 inline mr-1" />
                      Bedrooms
                    </label>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className="w-full text-slate-900 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option
                          className="text-slate-900"
                          key={num}
                          value={num}
                        >
                          {num} Bedroom{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Bath className="w-4 h-4 inline mr-1" />
                      Bathrooms
                    </label>
                    <select
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className="w-full text-slate-900 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option
                          className="text-slate-900"
                          key={num}
                          value={num}
                        >
                          {num} Bathroom{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="w-4 h-4 inline mr-1" />
                      Property Type
                    </label>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleInputChange}
                      className="w-full text-slate-900 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option className="text-slate-900" value="apartment">
                        Apartment
                      </option>
                      <option className="text-slate-900" value="house">
                        House
                      </option>
                      <option className="text-slate-900" value="studio">
                        Studio
                      </option>
                      <option className="text-slate-900" value="room">
                        Room
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      Furnishing
                    </label>
                    <select
                      name="furnishing"
                      value={formData.furnishing}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="furnished">Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                      <option value="part-furnished">Part Furnished</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_btr"
                      checked={formData.is_btr}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Build-to-Rent (BTR) Property
                    </span>
                  </label>
                </div>
              </div>

              {/* Lifestyle Features */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Lifestyle Features
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lifestyleFeatures.map((feature) => {
                    const Icon = feature.icon;
                    const isSelected = formData.lifestyle_features?.includes(
                      feature.id
                    );

                    return (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() => handleLifestyleFeatureToggle(feature.id)}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium text-center">
                          {feature.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Media Manager */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Property Media
                  </h2>
                </div>

                <MediaManager
                  propertyId={property?.id || ""}
                  media={media}
                  accessToken={accessToken}
                  onMediaUpdate={handleMediaUpdate}
                  disabled={saving}
                  maxFiles={10}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push("/app/properties/manage")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
