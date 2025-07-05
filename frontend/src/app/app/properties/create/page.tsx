"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import DashboardHeader from "../../../components/DashboardHeader";
import {
  ArrowLeft,
  Upload,
  X,
  Home,
  MapPin,
  Bed,
  Bath,
  Calendar,
  DollarSign,
  FileImage,
  AlertCircle,
} from "lucide-react";

interface PropertyFormData {
  title: string;
  description: string;
  address: string;
  price: number | string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnishing: string;
  lifestyle_features: string[];
  available_from: string;
  is_btr: boolean;
}

export default function CreatePropertyPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    address: "",
    price: "",
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    furnishing: "unfurnished",
    lifestyle_features: [],
    available_from: "",
    is_btr: false,
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Property type options
  const propertyTypes = [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "studio", label: "Studio" },
    { value: "room", label: "Room" },
    { value: "penthouse", label: "Penthouse" },
  ];

  // Furnishing options
  const furnishingOptions = [
    { value: "furnished", label: "Furnished" },
    { value: "unfurnished", label: "Unfurnished" },
    { value: "part-furnished", label: "Part Furnished" },
  ];

  // Lifestyle features options
  const lifestyleFeatureOptions = [
    "gym",
    "pool",
    "concierge",
    "garden",
    "parking",
    "balcony",
    "rooftop",
    "cinema",
    "study-zones",
    "bike-storage",
    "laundry",
    "high-speed-wifi",
    "meeting-rooms",
    "coworking",
    "pet-washing",
    "electric-charging",
    "security",
    "lift",
    "dishwasher",
  ];

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/app/auth/login");
      return;
    }

    if (!user.is_operator) {
      router.push("/app/dashboard/tenant");
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "price" ? value : parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLifestyleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      lifestyle_features: prev.lifestyle_features.includes(feature)
        ? prev.lifestyle_features.filter((f) => f !== feature)
        : [...prev.lifestyle_features, feature],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }

    const validFiles = files.filter((file) => {
      const isValid = file.type.startsWith("image/");
      const isSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValid && isSize;
    });

    if (validFiles.length !== files.length) {
      setError("Some files were rejected. Only images under 5MB are allowed.");
    }

    setImages((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const submitData = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "lifestyle_features") {
          // Handle lifestyle features array
          if (Array.isArray(value) && value.length > 0) {
            value.forEach((feature: string) => {
              submitData.append("lifestyle_features", feature);
            });
          }
        } else if (key === "price") {
          // Convert price to number, ensure it's not empty
          const priceValue = value === "" ? "0" : value.toString();
          submitData.append(key, priceValue);
        } else if (key === "is_btr") {
          // Handle boolean value
          submitData.append(key, value ? "true" : "false");
        } else {
          // Handle all other fields
          submitData.append(key, value.toString());
        }
      });

      // Add images
      images.forEach((image) => {
        submitData.append("images", image);
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/properties`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          // Don't set Content-Type for FormData - browser sets it automatically with boundary
        },
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Property creation error:", response.status, errorData);
        throw new Error(
          `Failed to create property: ${response.status} - ${errorData}`
        );
      }

      setSuccess("Property created successfully!");

      // Redirect to properties page after success
      setTimeout(() => {
        router.push("/app/properties");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create property");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/app/dashboard/operator")}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  Add New Property
                </h1>
                <p className="text-slate-600">
                  Create a new property listing for tenants to discover
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Property Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="text-slate-900 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., Luxury 2-bed apartment in Central London"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="text-slate-900 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Describe your property in detail..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="text-slate-900 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Full property address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Monthly Rent (£) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="text-slate-900 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="2500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Property Type *
                    </label>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleInputChange}
                      required
                      className="text-slate-900 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {propertyTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Bed className="w-4 h-4" />
                      Bedrooms *
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="text-slate-900 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Bath className="w-4 h-4" />
                      Bathrooms *
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="text-slate-900 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Furnishing *
                    </label>
                    <select
                      name="furnishing"
                      value={formData.furnishing}
                      onChange={handleInputChange}
                      required
                      className="text-slate-900 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {furnishingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Available From *
                    </label>
                    <input
                      type="date"
                      name="available_from"
                      value={formData.available_from}
                      onChange={handleInputChange}
                      required
                      className="text-slate-900 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Lifestyle Features */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">
                  Lifestyle Features
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {lifestyleFeatureOptions.map((feature) => (
                    <label
                      key={feature}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.lifestyle_features.includes(feature)}
                        onChange={() => handleLifestyleFeatureToggle(feature)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700 capitalize">
                        {feature.replace("-", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Property Images */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <FileImage className="w-5 h-5" />
                  Property Images
                </h3>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">
                      Click to upload images
                    </p>
                    <p className="text-sm text-slate-500">
                      Maximum 10 images, 5MB each
                    </p>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">
                  Additional Options
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_btr"
                    checked={formData.is_btr}
                    onChange={handleInputChange}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">
                    This is a Build-to-Rent (BTR) property
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="border-t border-slate-200 pt-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => router.push("/app/dashboard/operator")}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating Property...
                      </>
                    ) : (
                      <>
                        <Home className="w-5 h-5" />
                        Create Property
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
