"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/store/hooks";
import { usePropertyForm } from "@/app/hooks/usePropertyForm";
import { getUserRole } from "@/app/utils/simpleRedirect";
import { PropertyMedia } from "@/app/types";
import DashboardHeader from "../../../../components/DashboardHeader";
import MediaManager from "../../../../components/MediaManager";
import LifestyleFeaturesSelector from "../../../../components/LifestyleFeaturesSelector";
import {
  InputField,
  TextAreaField,
  SelectField,
} from "../../../../components/ui/FormField";
import { LoadingPage } from "../../../../components/ui/LoadingSpinner";
import { Button } from "../../../../components/ui/Button";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";

export default function EditPropertyPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const {
    property,
    media,
    loading,
    saving,
    error,
    success,
    formErrors,
    formData,
    setFormData,
    setMedia,
    handleSave,
    clearErrors,
    clearSuccess,
  } = usePropertyForm();


  // Check user permissions
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/app/units");
      return;
    }

    // Check if user is operator using the proper role system
    const userRole = getUserRole(user);
    if (userRole !== "operator" && userRole !== "admin") {
      router.push("/app/units");
      return;
    }

    if (property && property.operator_id !== user.id && userRole !== "admin") {
      router.push("/app/dashboard/operator");
      return;
    }
  }, [isAuthenticated, user, property, router]);

  // Redirect on success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/app/properties/manage");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleMediaUpdate = (updatedMedia: PropertyMedia[]) => {
    setMedia(updatedMedia);
  };


  // Check user permissions
  if (!user || !isAuthenticated) {
    return null;
  }

  if (loading) {
    return <LoadingPage text="Loading property details..." />;
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
              <Button
                onClick={() => window.history.back()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to Properties
              </Button>
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
            <Button
              onClick={() => window.history.back()}
              variant="ghost"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Properties
            </Button>

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

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleSave();
            }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Property Details */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Basic Information
                  </h2>

                  <div className="space-y-4">
                    <InputField
                      label="Property Title"
                      name="title"
                      value={formData.title}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: value as string,
                        }))
                      }
                      error={formErrors.title}
                      required
                      placeholder="e.g., Modern 2-Bedroom Flat in Central London"
                    />

                    <TextAreaField
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, description: value }))
                      }
                      error={formErrors.description}
                      required
                      placeholder="Describe your property..."
                    />

                    <InputField
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: value as string,
                        }))
                      }
                      error={formErrors.address}
                      required
                      placeholder="e.g., 123 Oxford Street, London W1D 2HX"
                    />
                  </div>
                </div>

                {/* Property Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Property Details
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Monthly Rent (£)"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: value as number,
                        }))
                      }
                      error={formErrors.price}
                      required
                      min={0}
                      placeholder="e.g., 2500"
                    />

                    <InputField
                      label="Available From"
                      name="available_from"
                      type="date"
                      value={formData.available_from}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          available_from: value as string,
                        }))
                      }
                      error={formErrors.available_from}
                      required
                    />

                    <SelectField
                      label="Bedrooms"
                      name="bedrooms"
                      value={formData.bedrooms.toString()}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          bedrooms: parseInt(value),
                        }))
                      }
                      options={[1, 2, 3, 4, 5, 6].map((num) => ({
                        value: num.toString(),
                        label: `${num} Bedroom${num > 1 ? "s" : ""}`,
                      }))}
                    />

                    <SelectField
                      label="Bathrooms"
                      name="bathrooms"
                      value={formData.bathrooms.toString()}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          bathrooms: parseInt(value),
                        }))
                      }
                      options={[1, 2, 3, 4, 5, 6].map((num) => ({
                        value: num.toString(),
                        label: `${num} Bathroom${num > 1 ? "s" : ""}`,
                      }))}
                    />

                    <SelectField
                      label="Property Type"
                      name="property_type"
                      value={formData.property_type}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_type: value,
                        }))
                      }
                      options={[
                        { value: "apartment", label: "Apartment" },
                        { value: "house", label: "House" },
                        { value: "studio", label: "Studio" },
                        { value: "room", label: "Room" },
                      ]}
                    />

                    <SelectField
                      label="Furnishing"
                      name="furnishing"
                      value={formData.furnishing}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, furnishing: value }))
                      }
                      options={[
                        { value: "furnished", label: "Furnished" },
                        { value: "unfurnished", label: "Unfurnished" },
                        { value: "part-furnished", label: "Part Furnished" },
                      ]}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_btr"
                        checked={formData.is_btr}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_btr: e.target.checked,
                          }))
                        }
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Lifestyle Features
                  </h2>

                  <LifestyleFeaturesSelector
                    selectedFeatures={formData.lifestyle_features}
                    onFeaturesChange={(features) =>
                      setFormData((prev) => ({
                        ...prev,
                        lifestyle_features: features,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Right Column - Media Manager */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Property Media
                  </h2>

                  <MediaManager
                    propertyId={property?.id || ""}
                    media={media}
                    onMediaUpdate={handleMediaUpdate}
                    disabled={saving}
                    maxFiles={10}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => window.history.back()}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>Save Changes</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
  );
}
