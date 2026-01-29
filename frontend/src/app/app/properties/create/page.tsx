"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/store/hooks";
import DashboardHeader from "../../../components/DashboardHeader";
import MediaUpload, {
  MediaUploadRef,
  MediaFile as MediaUploadFile,
} from "../../../components/MediaUpload";
import {
  Building,
  Home,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Calendar,
  Bed,
  Bath,
  ArrowLeft,
  AlertCircle,
  Heart,
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
  Camera,
  DollarSign,
} from "lucide-react";

// Form data interface
interface PropertyFormData {
  title: string;
  descriptions: string; // Changed from description to descriptions to match backend
  address: string;
  price: number;
  available_from: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnishing: string;
  is_btr: boolean;
  lifestyle_features: string[];
}

// Use the MediaFile type from MediaUpload component
type MediaFile = MediaUploadFile;

interface FormFieldErrors {
  [key: string]: string;
}

// Lifestyle features options
const lifestyleFeatures = [
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "pool", label: "Swimming Pool", icon: Waves },
  { id: "concierge", label: "Concierge", icon: Users },
  { id: "security", label: "24/7 Security", icon: Shield },
  { id: "parking", label: "Parking", icon: Car },
  { id: "wifi", label: "High-Speed WiFi", icon: Wifi },
  { id: "garden", label: "Garden/Terrace", icon: TreePine },
  { id: "lounge", label: "Resident Lounge", icon: Coffee },
  { id: "kitchen", label: "Shared Kitchen", icon: Utensils },
  { id: "entertainment", label: "Entertainment Room", icon: Tv },
  { id: "aircon", label: "Air Conditioning", icon: Wind },
  { id: "cleaning", label: "Cleaning Service", icon: Sparkles },
  { id: "coworking", label: "Co-working Space", icon: Building2 },
  { id: "laundry", label: "Laundry Facilities", icon: Zap },
];

interface RequiredLabelProps {
  children: React.ReactNode;
  required?: boolean;
  tooltip?: string;
}

const RequiredLabel: React.FC<RequiredLabelProps> = ({
  children,
  required = false,
  tooltip,
}) => (
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
    {tooltip && (
      <span className="text-xs text-slate-500 block font-normal mt-1">
        {tooltip}
      </span>
    )}
  </label>
);

interface ErrorMessageProps {
  error?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) return null;
  return (
    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{error}</span>
    </p>
  );
};

export default function CreatePropertyPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [backendErrors, setBackendErrors] = useState<FormFieldErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);

  // Ref for MediaUpload component
  const mediaUploadRef = useRef<MediaUploadRef>(null);

  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    descriptions: "", // Changed from description to descriptions
    address: "",
    price: 0,
    available_from: "",
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    furnishing: "furnished",
    is_btr: false,
    lifestyle_features: [],
  });

  // Define required fields - only title is required on backend
  const REQUIRED_FIELDS: { [key: string]: boolean } = {
    title: true,
  };

  // Validation function for a specific field
  const validateField = (fieldName: string, value: any): string => {
    const isRequired = REQUIRED_FIELDS[fieldName];

    switch (fieldName) {
      case "title":
        if (
          !value ||
          (typeof value === "string" && value.trim().length === 0)
        ) {
          return "Title is required";
        }
        if (typeof value === "string" && value.trim().length < 3) {
          return "Title must be at least 3 characters";
        }
        break;
      case "descriptions":
        // Optional field, but if provided, should meet minimum length
        if (
          value &&
          typeof value === "string" &&
          value.trim().length > 0 &&
          value.trim().length < 10
        ) {
          return "Description must be at least 10 characters if provided";
        }
        break;
      case "address":
        // Optional field, but if provided, should meet minimum length
        if (
          value &&
          typeof value === "string" &&
          value.trim().length > 0 &&
          value.trim().length < 5
        ) {
          return "Address must be at least 5 characters if provided";
        }
        break;
      case "price":
        // No validation - completely optional
        break;
      case "available_from":
        // No validation - completely optional
        break;
      case "bedrooms":
        if (isRequired) {
          if (!value || value === 0 || value === "") {
            return "Bedrooms is required";
          }
          const bedroomsNum =
            typeof value === "string" ? parseInt(value, 10) : value;
          if (isNaN(bedroomsNum) || bedroomsNum < 1) {
            return "Bedrooms must be at least 1";
          }
        }
        break;
      case "bathrooms":
        if (isRequired) {
          if (!value || value === 0 || value === "") {
            return "Bathrooms is required";
          }
          const bathroomsNum =
            typeof value === "string" ? parseInt(value, 10) : value;
          if (isNaN(bathroomsNum) || bathroomsNum < 1) {
            return "Bathrooms must be at least 1";
          }
        }
        break;
      case "property_type":
        if (isRequired) {
          if (
            !value ||
            (typeof value === "string" && value.trim().length === 0)
          ) {
            return "Property type is required";
          }
        }
        break;
      case "furnishing":
        if (isRequired) {
          if (
            !value ||
            (typeof value === "string" && value.trim().length === 0)
          ) {
            return "Furnishing is required";
          }
        }
        break;
    }
    return "";
  };

  // Validate all fields for a specific step
  const validateStep = (stepNumber: number): FormFieldErrors => {
    const errors: FormFieldErrors = {};

    if (stepNumber === 1) {
      // Step 1: Basic Information - only title is required
      const titleError = validateField("title", formData.title);
      if (titleError) errors.title = titleError;

      // Optional fields - validate only if they have values
      if (formData.descriptions) {
        const descriptionsError = validateField(
          "descriptions",
          formData.descriptions,
        );
        if (descriptionsError) errors.descriptions = descriptionsError;
      }

      if (formData.address) {
        const addressError = validateField("address", formData.address);
        if (addressError) errors.address = addressError;
      }
    } else if (stepNumber === 2) {
      // Step 2: Property Details - only required fields
      const bedroomsError = validateField("bedrooms", formData.bedrooms);
      if (bedroomsError) errors.bedrooms = bedroomsError;

      const bathroomsError = validateField("bathrooms", formData.bathrooms);
      if (bathroomsError) errors.bathrooms = bathroomsError;

      const propertyTypeError = validateField(
        "property_type",
        formData.property_type,
      );
      if (propertyTypeError) errors.property_type = propertyTypeError;

      const furnishingError = validateField("furnishing", formData.furnishing);
      if (furnishingError) errors.furnishing = furnishingError;
    }
    // Steps 3 and 4 don't have required fields

    return errors;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let newValue: any;
    if (type === "checkbox") {
      newValue = checked;
    } else if (type === "number") {
      newValue = value === "" ? 0 : parseFloat(value);
      if (isNaN(newValue)) newValue = 0;
    } else if (name === "bedrooms" || name === "bathrooms") {
      // Handle select elements that return strings but should be numbers
      newValue = parseInt(value, 10);
      if (isNaN(newValue)) newValue = 1;
    } else {
      newValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field in real-time if it's been touched
    if (touched[name]) {
      const error = validateField(name, newValue);
      setBackendErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[name] = error;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
    } else {
      // Clear error if field hasn't been touched yet
      setBackendErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));

    // Validate field on blur
    const value = formData[fieldName as keyof PropertyFormData];
    const error = validateField(fieldName, value);
    setBackendErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[fieldName] = error;
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  };

  const handleLifestyleFeatureToggle = (featureId: string) => {
    setFormData((prev) => ({
      ...prev,
      lifestyle_features: prev.lifestyle_features.includes(featureId)
        ? prev.lifestyle_features.filter((id) => id !== featureId)
        : [...prev.lifestyle_features, featureId],
    }));
  };

  const handleFilesSelected = (files: MediaFile[]) => {
    setSelectedFiles(files);
  };

  const nextStep = () => {
    // Validate current step before proceeding
    const stepErrors = validateStep(step);

    // Mark only REQUIRED fields in current step as touched (so errors will be visible)
    const newTouched: { [key: string]: boolean } = { ...touched };
    if (step === 1) {
      // Only title is required
      newTouched.title = true;
    }
    // Step 2+ have no required fields
    setTouched(newTouched);

    // Set all errors for current step (so they're all visible)
    if (Object.keys(stepErrors).length > 0) {
      setBackendErrors((prev) => ({ ...prev, ...stepErrors }));
      setError("Please fill in all required fields before proceeding");
      // Scroll to first error
      setTimeout(() => {
        const firstErrorField = Object.keys(stepErrors)[0];
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          (element as HTMLElement).focus();
        }
      }, 100);
      return;
    }

    // Clear error if validation passes
    setError("");
    setBackendErrors({});

    // Proceed to next step
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step !== 4) {
      console.log("Form submission prevented - not on final step");
      return;
    }

    // Validate all steps before submitting
    const allErrors: FormFieldErrors = {};

    // Validate step 1 fields
    const step1Errors = validateStep(1);
    Object.assign(allErrors, step1Errors);

    // Validate step 2 fields
    const step2Errors = validateStep(2);
    Object.assign(allErrors, step2Errors);

    // Mark only REQUIRED fields as touched (so errors will be visible)
    const allTouched: { [key: string]: boolean } = {
      title: true,
    };
    setTouched(allTouched);

    if (Object.keys(allErrors).length > 0) {
      setBackendErrors(allErrors);
      setError("Please fill in all required fields before submitting");
      // Go back to first step with errors
      setStep(1);
      // Scroll to first error
      setTimeout(() => {
        const firstErrorField = Object.keys(allErrors)[0];
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          (element as HTMLElement).focus();
        }
      }, 100);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setBackendErrors({});

    try {
      // Step 1: Create the property
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(`${apiUrl}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.errors) {
          const errors = responseData.errors;
          const fieldErrors: FormFieldErrors = {};

          Object.keys(errors).forEach((field) => {
            fieldErrors[field] = Array.isArray(errors[field])
              ? errors[field][0]
              : errors[field];
          });

          setBackendErrors(fieldErrors);
        } else {
          setError(responseData.message || "Failed to create property");
        }
        return;
      }

      // Step 2: Upload media files if any
      if (selectedFiles.length > 0 && mediaUploadRef.current && accessToken) {
        try {
          await mediaUploadRef.current.uploadFiles(
            responseData.id,
            accessToken,
          );
        } catch (uploadError) {
          console.error("Media upload failed:", uploadError);
          // Property was created but media upload failed
          setError(
            "Property created successfully, but some media files failed to upload. You can add them later from the property management page.",
          );
          setTimeout(() => {
            router.push("/app/dashboard/operator");
          }, 3000);
          return;
        }
      }

      // Success
      setSuccess("Property created successfully!");
      setTimeout(() => {
        router.push("/app/dashboard/operator");
      }, 2000);
    } catch (err: unknown) {
      console.error("Error creating property:", err);
      setError("Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAuthenticated || !accessToken) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <DashboardHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200/50 backdrop-blur-sm relative">
            {/* Back Button - Top Right */}
            <button
              onClick={() => router.push("/app/dashboard/operator")}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center justify-center w-10 h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 rounded-full group"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-200" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pr-12 sm:pr-16">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Home className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Add New Property
                </h1>
                <p className="text-slate-600 text-base sm:text-lg">
                  Create a stunning property listing that attracts quality
                  tenants
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Step {step} of 4
              </span>
              <span className="text-sm text-slate-500">
                {((step / 4) * 100).toFixed(0)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-700 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="font-medium">{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <div className="w-32"></div>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Basic Information
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Essential property details
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:bg-slate-400 disabled:cursor-not-allowed"
                  title={
                    Object.keys(validateStep(1)).length > 0
                      ? "Please fix validation errors"
                      : ""
                  }
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <RequiredLabel
                      required
                      tooltip="A compelling title for your property listing"
                    >
                      Property Title
                    </RequiredLabel>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("title")}
                      className={`w-full text-slate-900 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm ${
                        (touched.title || backendErrors.title) &&
                        backendErrors.title
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="e.g., Luxury 2-bed flat in Central London"
                      required
                    />
                    <ErrorMessage error={backendErrors.title} />
                  </div>

                  <div className="lg:col-span-2">
                    <RequiredLabel tooltip="Detailed description to attract potential tenants">
                      Description
                    </RequiredLabel>
                    <textarea
                      name="descriptions"
                      value={formData.descriptions}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("descriptions")}
                      rows={4}
                      className={`w-full text-slate-900 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none ${
                        (touched.descriptions || backendErrors.descriptions) &&
                        backendErrors.descriptions
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="Describe your property's unique features, location benefits, and what makes it special..."
                    />
                    <ErrorMessage error={backendErrors.descriptions} />
                  </div>

                  <div className="lg:col-span-2">
                    <RequiredLabel>
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Address
                    </RequiredLabel>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("address")}
                      className={`w-full text-slate-900 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm ${
                        (touched.address || backendErrors.address) &&
                        backendErrors.address
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="e.g., 123 Oxford Street, London W1D 2HX"
                    />
                    <ErrorMessage error={backendErrors.address} />
                  </div>

                  <div>
                    <RequiredLabel>
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Monthly Rent (£)
                    </RequiredLabel>
                    <input
                      type="number"
                      name="price"
                      value={formData.price || ""}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("price")}
                      min="0"
                      step="50"
                      className={`w-full text-slate-900 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm ${
                        (touched.price || backendErrors.price) &&
                        backendErrors.price
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="2500"
                    />
                    <ErrorMessage error={backendErrors.price} />
                  </div>

                  <div>
                    <RequiredLabel>
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Available From
                    </RequiredLabel>
                    <input
                      type="date"
                      name="available_from"
                      value={formData.available_from}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("available_from")}
                      className={`w-full text-slate-900 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm ${
                        (touched.available_from ||
                          backendErrors.available_from) &&
                        backendErrors.available_from
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    <ErrorMessage error={backendErrors.available_from} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Property Details
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Specifications and features
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:bg-slate-400 disabled:cursor-not-allowed"
                  title={
                    Object.keys(validateStep(2)).length > 0
                      ? "Please fix validation errors"
                      : ""
                  }
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <RequiredLabel>
                      <Bed className="inline w-4 h-4 mr-1" />
                      Bedrooms
                    </RequiredLabel>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("bedrooms")}
                      className={`w-full text-slate-900 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm ${
                        (touched.bedrooms || backendErrors.bedrooms) &&
                        backendErrors.bedrooms
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300"
                      }`}
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Bedroom" : "Bedrooms"}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage error={backendErrors.bedrooms} />
                  </div>

                  <div>
                    <RequiredLabel>
                      <Bath className="inline w-4 h-4 mr-1" />
                      Bathrooms
                    </RequiredLabel>
                    <select
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("bathrooms")}
                      className={`w-full text-slate-900 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm ${
                        (touched.bathrooms || backendErrors.bathrooms) &&
                        backendErrors.bathrooms
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300"
                      }`}
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Bathroom" : "Bathrooms"}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage error={backendErrors.bathrooms} />
                  </div>

                  <div>
                    <RequiredLabel required>Property Type</RequiredLabel>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("property_type")}
                      className={`w-full text-slate-900 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm ${
                        (touched.property_type ||
                          backendErrors.property_type) &&
                        backendErrors.property_type
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300"
                      }`}
                      required
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="loft">Loft</option>
                      <option value="duplex">Duplex</option>
                    </select>
                    <ErrorMessage error={backendErrors.property_type} />
                  </div>

                  <div>
                    <RequiredLabel>Furnishing</RequiredLabel>
                    <select
                      name="furnishing"
                      value={formData.furnishing}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("furnishing")}
                      className={`w-full text-slate-900 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm ${
                        (touched.furnishing || backendErrors.furnishing) &&
                        backendErrors.furnishing
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300"
                      }`}
                    >
                      <option value="furnished">Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                      <option value="part-furnished">Part-furnished</option>
                    </select>
                    <ErrorMessage error={backendErrors.furnishing} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_btr"
                        checked={formData.is_btr}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        This is a Build-to-Rent (BTR) property
                      </span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 ml-8">
                      BTR properties are purpose-built rental developments
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Lifestyle Features */}
          {step === 3 && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Lifestyle Features
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Amenities and facilities
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {lifestyleFeatures.map((feature) => {
                    const Icon = feature.icon;
                    const isSelected = formData.lifestyle_features.includes(
                      feature.id,
                    );

                    return (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() => handleLifestyleFeatureToggle(feature.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 text-center hover:shadow-md ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-medium">
                          {feature.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600">
                    <strong>Selected features:</strong>{" "}
                    {formData.lifestyle_features.length > 0
                      ? formData.lifestyle_features
                          .map(
                            (id) =>
                              lifestyleFeatures.find((f) => f.id === id)?.label,
                          )
                          .join(", ")
                      : "None selected"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Step 4: Media & Review */}
          {step === 4 && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Media & Review
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Upload photos and finalize
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Property"
                  )}
                </button>
              </div>

              <div className="space-y-8">
                {/* Media Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Property Media
                  </h3>
                  <MediaUpload
                    ref={mediaUploadRef}
                    onFilesSelected={handleFilesSelected}
                    maxFiles={10}
                    disabled={loading}
                  />
                </div>

                {/* Review Summary */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">
                    Review Your Property
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Title</p>
                        <p className="font-medium text-slate-900">
                          {formData.title || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Price</p>
                        <p className="font-medium text-slate-900">
                          £{formData.price || 0}/month
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-800">Address</p>
                        <p className="font-medium text-slate-900">
                          {formData.address || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Available From</p>
                        <p className="font-medium text-slate-900">
                          {formData.available_from || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Bedrooms</p>
                        <p className="font-medium text-slate-900">
                          {formData.bedrooms}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Bathrooms</p>
                        <p className="font-medium text-slate-900">
                          {formData.bathrooms}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Property Type</p>
                        <p className="font-medium text-slate-900 capitalize">
                          {formData.property_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Furnishing</p>
                        <p className="font-medium text-slate-900 capitalize">
                          {formData.furnishing}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">BTR Property</p>
                        <p className="font-medium text-slate-900">
                          {formData.is_btr ? "Yes" : "No"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Media Files</p>
                        <p className="font-medium text-slate-900">
                          {selectedFiles.length} files selected
                        </p>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-slate-600">Description</p>
                      <p className="font-medium text-slate-900">
                        {formData.descriptions || "Not specified"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-slate-600">
                        Lifestyle Features
                      </p>
                      <p className="font-medium text-slate-900">
                        {formData.lifestyle_features.length > 0
                          ? formData.lifestyle_features
                              .map(
                                (id) =>
                                  lifestyleFeatures.find((f) => f.id === id)
                                    ?.label,
                              )
                              .join(", ")
                          : "None selected"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </form>
      </div>
    </div>
  );
}
