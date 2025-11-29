"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Plus, Minus, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { buildingsAPI, usersAPI } from "../lib/api";

interface MetroStation {
  label: string;
  destination: number;
}

interface CommuteTime {
  label: string;
  destination: number;
}

interface LocalEssential {
  label: string;
  destination: number;
}

interface ConciergeHours {
  from: number;
  to: number;
}

interface Pet {
  type: "dog" | "cat" | "other";
  customType?: string;
  size?: "small" | "medium" | "large";
}

interface Operator {
  id: string;
  full_name?: string;
  email: string;
  operatorProfile?: {
    company_name?: string;
    full_name?: string;
  };
}

interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

const AddBuildingModal: React.FC<AddBuildingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    number_of_units: null as number | null,
    type_of_unit: [] as string[],
    logo: "",
    video: "",
    photos: [] as string[],
    documents: "",
    metro_stations: [] as MetroStation[],
    commute_times: [] as CommuteTime[],
    local_essentials: [] as LocalEssential[],
    amenities: [] as string[],
    is_concierge: false,
    concierge_hours: null as ConciergeHours | null,
    pet_policy: false,
    pets: null as Pet[] | null,
    smoking_area: false,
    tenant_type: [] as string[],
    operator_id: null as string | null,
  });

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  // Preview URLs
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);

  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Operators state
  const [operators, setOperators] = useState<Operator[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  // Load operators when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadOperators = async () => {
        setOperatorsLoading(true);
        try {
          // Fetch all operators using role filter and high limit
          const response = await usersAPI.getAll({
            role: "operator",
            limit: 1000, // Get all operators
            page: 1,
          });

          // Handle paginated response format: { users: [], total, page, limit, totalPages }
          const responseData = response.data || {};
          const operatorsList =
            responseData.users ||
            (Array.isArray(responseData) ? responseData : []) ||
            [];

          // Filter to ensure only operators (double check)
          const filteredOperators = operatorsList.filter(
            (user: any) => user.role === "operator" || user.role === "Operator"
          );

          console.log(
            `✅ Loaded ${filteredOperators.length} operators from API`
          );
          console.log("Operators list:", filteredOperators);
          setOperators(filteredOperators);
        } catch (error) {
          console.error("Failed to load operators:", error);
          toast.error("Failed to load operators");
        } finally {
          setOperatorsLoading(false);
        }
      };

      loadOperators();
    }
  }, [isOpen]);

  // Generate preview URLs for logo
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLogoPreview(null);
    }
  }, [logoFile]);

  // Generate preview URLs for video
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoPreview(null);
    }
  }, [videoFile]);

  // Generate preview URLs for photos
  useEffect(() => {
    const urls = photoFiles.map((file) => {
      try {
        return URL.createObjectURL(file);
      } catch (error) {
        console.error("Error creating preview URL:", error);
        return "";
      }
    });
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photoFiles]);

  // Generate preview URLs for documents (PDF thumbnails)
  useEffect(() => {
    const urls = documentFiles.map((file) => URL.createObjectURL(file));
    setDocumentPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [documentFiles]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const typeOfUnitDropdown = document.getElementById(
        "add_type_of_unit_dropdown"
      );
      const tenantTypeDropdown = document.getElementById(
        "add_tenant_type_dropdown"
      );

      if (
        typeOfUnitDropdown &&
        !typeOfUnitDropdown.contains(event.target as Node) &&
        !event.target.closest('[onclick*="add_type_of_unit_dropdown"]')
      ) {
        typeOfUnitDropdown.classList.add("hidden");
      }

      if (
        tenantTypeDropdown &&
        !tenantTypeDropdown.contains(event.target as Node) &&
        !event.target.closest('[onclick*="add_tenant_type_dropdown"]')
      ) {
        tenantTypeDropdown.classList.add("hidden");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const uploadAllFiles = async () => {
    const uploadPromises = [];
    const errors: string[] = [];
    const uploadedUrls = {
      logo: "",
      video: "",
      photos: [] as string[],
      documents: "",
    };

    // Upload logo if selected
    if (logoFile) {
      uploadPromises.push(
        buildingsAPI
          .uploadLogo(logoFile)
          .then((result: { url: string; key: string }) => {
            uploadedUrls.logo = result.url;
            console.log("✅ Logo uploaded successfully");
          })
          .catch((error: any) => {
            console.error("❌ Logo upload failed:", error);
            errors.push("Logo upload failed");
          })
      );
    }

    // Upload video if selected
    if (videoFile) {
      uploadPromises.push(
        buildingsAPI
          .uploadVideo(videoFile)
          .then((result: { url: string; key: string }) => {
            uploadedUrls.video = result.url;
            console.log("✅ Video uploaded successfully");
          })
          .catch((error: any) => {
            console.error("❌ Video upload failed:", error);
            errors.push("Video upload failed");
          })
      );
    }

    // Upload photos if selected
    if (photoFiles.length > 0) {
      uploadPromises.push(
        buildingsAPI
          .uploadPhotos(photoFiles)
          .then((results: { url: string; key: string }[]) => {
            uploadedUrls.photos = results.map((r) => r.url);
            console.log(`✅ ${results.length} photos uploaded successfully`);
          })
          .catch((error: any) => {
            console.error("❌ Photos upload failed:", error);
            errors.push("Photos upload failed");
          })
      );
    }

    // Upload documents if selected
    if (documentFiles.length > 0) {
      uploadPromises.push(
        buildingsAPI
          .uploadDocuments(documentFiles)
          .then((results: { url: string; key: string }[]) => {
            if (results && results.length > 0) {
              uploadedUrls.documents = results[0].url;
            }
            console.log(`✅ ${results.length} documents uploaded successfully`);
          })
          .catch((error: any) => {
            console.error("❌ Documents upload failed:", error);
            errors.push("Documents upload failed");
          })
      );
    }

    if (uploadPromises.length > 0) {
      await Promise.allSettled(uploadPromises);

      // Show errors if any occurred
      if (errors.length > 0) {
        toast.error(`Some uploads failed: ${errors.join("; ")}`);
      }
    }

    return {
      uploadedUrls,
      hasErrors: errors.length > 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload files first
    const uploadResult = await uploadAllFiles();

    // Ensure operator_id is only the ID string, not an object
    let operatorIdValue: string | null = null;
    if (formData.operator_id) {
      if (
        typeof formData.operator_id === "string" &&
        formData.operator_id.trim() !== ""
      ) {
        operatorIdValue = formData.operator_id.trim();
      } else if (
        typeof formData.operator_id === "object" &&
        formData.operator_id !== null &&
        "id" in formData.operator_id
      ) {
        // If somehow an object was passed, extract the ID
        operatorIdValue = (formData.operator_id as any).id;
        console.warn(
          "⚠️ operator_id was an object, extracting ID:",
          operatorIdValue
        );
      }
    }

    // Prepare data with uploaded URLs
    const buildingData: any = {
      name: formData.name,
      // Only send operator_id as string or null, never as object
      operator_id: operatorIdValue,
    };

    // Add optional fields only if they have values
    if (formData.address && formData.address.trim() !== "") {
      buildingData.address = formData.address;
    }
    if (formData.number_of_units != null) {
      buildingData.number_of_units = formData.number_of_units;
    }
    if (formData.type_of_unit && formData.type_of_unit.length > 0) {
      buildingData.type_of_unit = formData.type_of_unit;
    }
    if (
      uploadResult.uploadedUrls.logo ||
      (formData.logo && formData.logo.trim() !== "")
    ) {
      buildingData.logo = uploadResult.uploadedUrls.logo || formData.logo;
    }
    if (
      uploadResult.uploadedUrls.video ||
      (formData.video && formData.video.trim() !== "")
    ) {
      buildingData.video = uploadResult.uploadedUrls.video || formData.video;
    }
    if (
      uploadResult.uploadedUrls.photos.length > 0 ||
      (formData.photos && formData.photos.length > 0)
    ) {
      buildingData.photos =
        uploadResult.uploadedUrls.photos.length > 0
          ? uploadResult.uploadedUrls.photos
          : formData.photos;
    }
    if (
      uploadResult.uploadedUrls.documents ||
      (formData.documents && formData.documents.trim() !== "")
    ) {
      buildingData.documents =
        uploadResult.uploadedUrls.documents || formData.documents;
    }
    if (formData.metro_stations && formData.metro_stations.length > 0) {
      buildingData.metro_stations = formData.metro_stations;
    }
    if (formData.commute_times && formData.commute_times.length > 0) {
      buildingData.commute_times = formData.commute_times;
    }
    if (formData.local_essentials && formData.local_essentials.length > 0) {
      buildingData.local_essentials = formData.local_essentials;
    }
    if (formData.amenities && formData.amenities.length > 0) {
      buildingData.amenities = formData.amenities;
    }
    if (formData.is_concierge) {
      buildingData.is_concierge = formData.is_concierge;
    }
    if (formData.concierge_hours) {
      buildingData.concierge_hours = formData.concierge_hours;
    }
    if (formData.pet_policy) {
      buildingData.pet_policy = formData.pet_policy;
    }
    if (formData.pets && formData.pets.length > 0) {
      buildingData.pets = formData.pets;
    }
    if (formData.smoking_area) {
      buildingData.smoking_area = formData.smoking_area;
    }
    if (formData.tenant_type && formData.tenant_type.length > 0) {
      buildingData.tenant_type = formData.tenant_type;
    }

    console.log("📤 Submitting building data (Add):", {
      operator_id: buildingData.operator_id,
      operator_id_type: typeof buildingData.operator_id,
      formData_operator_id: formData.operator_id,
      formData_operator_id_type: typeof formData.operator_id,
    });

    await onSubmit(buildingData);
    if (!isLoading) {
      // Reset form
      setFormData({
        name: "",
        address: "",
        number_of_units: 1,
        type_of_unit: [] as string[],
        logo: "",
        video: "",
        photos: [],
        documents: "",
        metro_stations: [],
        commute_times: [],
        local_essentials: [],
        amenities: [],
        is_concierge: false,
        concierge_hours: null,
        pet_policy: false,
        pets: null,
        smoking_area: false,
        tenant_type: ["family"] as string[],
        operator_id: null,
      });

      // Reset file states
      setLogoFile(null);
      setVideoFile(null);
      setPhotoFiles([]);
      setDocumentFiles([]);

      // Reset preview states
      setLogoPreview(null);
      setVideoPreview(null);
      setPhotoPreviews([]);
      setDocumentPreviews([]);
    }
  };

  const addMetroStation = () => {
    setFormData((prev) => ({
      ...prev,
      metro_stations: [...prev.metro_stations, { label: "", destination: 0 }],
    }));
  };

  const removeMetroStation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      metro_stations: prev.metro_stations.filter((_, i) => i !== index),
    }));
  };

  const updateMetroStation = (
    index: number,
    field: keyof MetroStation,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      metro_stations: prev.metro_stations.map((station, i) =>
        i === index ? { ...station, [field]: value } : station
      ),
    }));
  };

  const addCommuteTime = () => {
    setFormData((prev) => ({
      ...prev,
      commute_times: [...prev.commute_times, { label: "", destination: 0 }],
    }));
  };

  const removeCommuteTime = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      commute_times: prev.commute_times.filter((_, i) => i !== index),
    }));
  };

  const updateCommuteTime = (
    index: number,
    field: keyof CommuteTime,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      commute_times: prev.commute_times.map((time, i) =>
        i === index ? { ...time, [field]: value } : time
      ),
    }));
  };

  const addLocalEssential = () => {
    setFormData((prev) => ({
      ...prev,
      local_essentials: [
        ...prev.local_essentials,
        { label: "", destination: 0 },
      ],
    }));
  };

  const removeLocalEssential = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      local_essentials: prev.local_essentials.filter((_, i) => i !== index),
    }));
  };

  const updateLocalEssential = (
    index: number,
    field: keyof LocalEssential,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      local_essentials: prev.local_essentials.map((essential, i) =>
        i === index ? { ...essential, [field]: value } : essential
      ),
    }));
  };

  const availableAmenities = [
    "Gym",
    "Co-working",
    "Meeting rooms",
    "Lounge",
    "Cinema",
    "Roof terrace",
    "Courtyard",
    "Parking",
    "Bike storage",
    "Parcel room",
    "Maintenance",
    "Events calendar",
    "Pet areas",
    "Kids' room",
    "Garden",
  ];

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addPet = () => {
    setFormData((prev) => ({
      ...prev,
      pets: [...(prev.pets || []), { type: "dog" as "dog" }],
    }));
  };

  const removePet = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pets: prev.pets ? prev.pets.filter((_, i) => i !== index) : null,
    }));
  };

  const updatePet = (index: number, field: keyof Pet, value: any) => {
    setFormData((prev) => ({
      ...prev,
      pets: prev.pets
        ? prev.pets.map((pet, i) =>
            i === index ? { ...pet, [field]: value } : pet
          )
        : null,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[8px] flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-black/50 backdrop-blur-[19px] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Add New Building</h2>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Number of Units
                </label>
                <input
                  type="number"
                  value={formData.number_of_units || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      number_of_units:
                        e.target.value === "" ? null : parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Type of Unit
                </label>
                <div className="relative">
                  <div
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center"
                    onClick={() => {
                      const dropdown = document.getElementById(
                        "add_type_of_unit_dropdown"
                      );
                      dropdown?.classList.toggle("hidden");
                    }}
                  >
                    <div className="flex flex-wrap gap-1 flex-1">
                      {formData.type_of_unit.length > 0 ? (
                        formData.type_of_unit.map((value) => {
                          const option = [
                            { value: "studio", label: "Studio" },
                            { value: "1-bed", label: "1-bed" },
                            { value: "2-bed", label: "2-bed" },
                            { value: "3-bed", label: "3-bed" },
                            { value: "Duplex", label: "Duplex" },
                            { value: "penthouse", label: "Penthouse" },
                          ].find((opt) => opt.value === value);
                          return (
                            <span
                              key={value}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                            >
                              {option?.label}
                              <button
                                type="button"
                                className="ml-1 text-white/70 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    type_of_unit: formData.type_of_unit.filter(
                                      (t) => t !== value
                                    ),
                                  });
                                }}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-white/50">Select types...</span>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-white/70 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <div
                    id="add_type_of_unit_dropdown"
                    className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto"
                  >
                    {[
                      { value: "studio", label: "Studio" },
                      { value: "1-bed", label: "1-bed" },
                      { value: "2-bed", label: "2-bed" },
                      { value: "3-bed", label: "3-bed" },
                      { value: "Duplex", label: "Duplex" },
                      { value: "penthouse", label: "Penthouse" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="px-4 py-2 hover:bg-white/20 cursor-pointer text-gray-800 flex items-center space-x-2"
                        onClick={() => {
                          const newTypeOfUnit = formData.type_of_unit.includes(
                            option.value
                          )
                            ? formData.type_of_unit.filter(
                                (t) => t !== option.value
                              )
                            : [...formData.type_of_unit, option.value];
                          setFormData({
                            ...formData,
                            type_of_unit: newTypeOfUnit,
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.type_of_unit.includes(option.value)}
                          readOnly
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Tenant Type
                </label>
                <div className="relative">
                  <div
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center"
                    onClick={() => {
                      const dropdown = document.getElementById(
                        "add_tenant_type_dropdown"
                      );
                      dropdown?.classList.toggle("hidden");
                    }}
                  >
                    <div className="flex flex-wrap gap-1 flex-1">
                      {formData.tenant_type.length > 0 ? (
                        formData.tenant_type.map((value) => {
                          const option = [
                            { value: "corporateLets", label: "Corporate Lets" },
                            { value: "sharers", label: "Sharers" },
                            { value: "student", label: "Student" },
                            { value: "family", label: "Family" },
                            { value: "elder", label: "Elder" },
                          ].find((opt) => opt.value === value);
                          return (
                            <span
                              key={value}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                            >
                              {option?.label}
                              <button
                                type="button"
                                className="ml-1 text-white/70 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    tenant_type: formData.tenant_type.filter(
                                      (t) => t !== value
                                    ),
                                  });
                                }}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-white/50">Select types...</span>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-white/70 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <div
                    id="add_tenant_type_dropdown"
                    className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto"
                  >
                    {[
                      { value: "corporateLets", label: "Corporate Lets" },
                      { value: "sharers", label: "Sharers" },
                      { value: "student", label: "Student" },
                      { value: "family", label: "Family" },
                      { value: "elder", label: "Elder" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="px-4 py-2 hover:bg-white/20 cursor-pointer text-gray-800 flex items-center space-x-2"
                        onClick={() => {
                          const newTenantType = formData.tenant_type.includes(
                            option.value
                          )
                            ? formData.tenant_type.filter(
                                (t) => t !== option.value
                              )
                            : [...formData.tenant_type, option.value];
                          setFormData({
                            ...formData,
                            tenant_type: newTenantType,
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.tenant_type.includes(option.value)}
                          readOnly
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Operator *
                </label>
                <select
                  value={formData.operator_id || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      operator_id: value === "" ? null : value,
                    });
                  }}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  required
                  disabled={operatorsLoading}
                >
                  <option value="">
                    {operatorsLoading
                      ? "Loading operators..."
                      : "Select an operator"}
                  </option>
                  {operators.map((operator) => {
                    const displayName =
                      operator.operatorProfile?.company_name ||
                      operator.operatorProfile?.full_name ||
                      operator.full_name ||
                      operator.email;
                    return (
                      <option key={operator.id} value={operator.id}>
                        {displayName}{" "}
                        {operator.email && displayName !== operator.email
                          ? `(${operator.email})`
                          : ""}
                      </option>
                    );
                  })}
                </select>
                {!operatorsLoading && operators.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No operators available
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Media Files (Optional)
            </h4>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Logo (Image File)
                </label>
                <div className="space-y-2">
                  <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setLogoFile(file);
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-white/70 mb-2" />
                      <p className="text-sm text-white/90 font-medium">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </label>
                  {logoFile && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg">
                        <Upload className="w-4 h-4 text-white/70" />
                        <span className="text-sm text-white/90 flex-1">
                          {logoFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setLogoFile(null)}
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20"
                        >
                          Remove
                        </button>
                      </div>
                      {logoPreview && (
                        <div className="mt-2">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="max-w-xs max-h-32 object-contain border border-white/20 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Video (Video File)
                </label>
                <div className="space-y-2">
                  <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setVideoFile(file);
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-white/70 mb-2" />
                      <p className="text-sm text-white/90 font-medium">
                        Click to upload video
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        MP4, AVI up to 100MB
                      </p>
                    </div>
                  </label>
                  {videoFile && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg">
                        <Upload className="w-4 h-4 text-white/70" />
                        <span className="text-sm text-white/90 flex-1">
                          {videoFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVideoFile(null)}
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20"
                        >
                          Remove
                        </button>
                      </div>
                      {videoPreview && (
                        <div className="mt-2">
                          <video
                            src={videoPreview}
                            controls
                            className="max-w-md max-h-64 border border-white/20 rounded-lg"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Photos Upload */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Photos (Image Files)
                </label>
                <div className="space-y-2">
                  <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files || []);
                        if (newFiles.length > 0) {
                          setPhotoFiles((prev) => [...prev, ...newFiles]);
                          // Reset input so user can select the same file again if needed
                          if (photoInputRef.current) {
                            photoInputRef.current.value = "";
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-white/70 mb-2" />
                      <p className="text-sm text-white/90 font-medium">
                        Click to upload photos
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        PNG, JPG - Multiple files allowed
                      </p>
                    </div>
                  </label>
                  {photoFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg mb-3">
                        <Upload className="w-4 h-4 text-white/70" />
                        <span className="text-sm text-white/90 flex-1">
                          {photoFiles.length} photo
                          {photoFiles.length > 1 ? "s" : ""} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhotoFiles([])}
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {photoFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="relative border border-white/20 rounded-lg overflow-hidden group bg-white/5"
                          >
                            <div className="relative w-full h-32 bg-white/5">
                              {photoPreviews[index] ? (
                                <img
                                  src={photoPreviews[index]}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error(
                                      "Failed to load image preview"
                                    );
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/40">
                                  <Upload className="w-8 h-8" />
                                </div>
                              )}
                              <div className="absolute inset-0 group-hover:bg-black/50 transition-opacity flex items-center justify-center z-10">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhotoFiles((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    )
                                  }
                                  className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-opacity border border-white/20"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className="p-2 bg-white/5">
                              <p className="text-xs text-white/70 truncate">
                                {file.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Upload */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Documents (PDF Files)
                </label>
                <div className="space-y-2">
                  <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setDocumentFiles(files);
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-white/70 mb-2" />
                      <p className="text-sm text-white/90 font-medium">
                        Click to upload documents
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        PDF files - Multiple files allowed
                      </p>
                    </div>
                  </label>
                  {documentFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg mb-3">
                        <Upload className="w-4 h-4 text-white/70" />
                        <span className="text-sm text-white/90 flex-1">
                          {documentFiles.length} PDF file
                          {documentFiles.length > 1 ? "s" : ""} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setDocumentFiles([])}
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {documentFiles.map((file, index) => (
                          <div
                            key={index}
                            className="relative border border-white/20 rounded-lg overflow-hidden group bg-white/5"
                          >
                            <div className="flex flex-col items-center justify-center p-4 h-32">
                              <svg
                                className="w-12 h-12 text-white/50 mb-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p className="text-xs text-white/70 text-center truncate w-full px-2">
                                {file.name}
                              </p>
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setDocumentFiles((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-opacity border border-white/20"
                              >
                                Remove
                              </button>
                            </div>
                            {documentPreviews[index] && (
                              <iframe
                                src={documentPreviews[index]}
                                className="hidden"
                                title={`PDF preview ${index + 1}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Amenities
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`amenity-${amenity}`}
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`amenity-${amenity}`}
                    className="text-sm font-medium text-white/90 cursor-pointer"
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>

            {formData.amenities.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-white/90 mb-2">
                  Selected amenities ({formData.amenities.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Concierge */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Concierge
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_concierge"
                checked={formData.is_concierge}
                onChange={(e) =>
                  setFormData({ ...formData, is_concierge: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="is_concierge"
                className="text-sm font-medium text-white/90"
              >
                Has Concierge Service
              </label>
            </div>

            {formData.is_concierge && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Opening Hour (0-23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.concierge_hours?.from || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        concierge_hours: {
                          from: parseInt(e.target.value) || 0,
                          to: formData.concierge_hours?.to || 22,
                        },
                      })
                    }
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Closing Hour (0-23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.concierge_hours?.to || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        concierge_hours: {
                          from: formData.concierge_hours?.from || 8,
                          to: parseInt(e.target.value) || 22,
                        },
                      })
                    }
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pets */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Pet Policy
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pet_policy"
                checked={formData.pet_policy}
                onChange={(e) =>
                  setFormData({ ...formData, pet_policy: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="pet_policy"
                className="text-sm font-medium text-white/90"
              >
                Pets Allowed
              </label>
            </div>

            {formData.pet_policy && (
              <div className="ml-6 space-y-4">
                {(formData.pets || []).map((pet, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-medium text-white">
                        Pet {index + 1}
                      </h5>
                      <button
                        type="button"
                        onClick={() => removePet(index)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Type
                        </label>
                        <select
                          value={pet.type}
                          onChange={(e) =>
                            updatePet(index, "type", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                        >
                          <option value="dog">Dog</option>
                          <option value="cat">Cat</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {pet.type === "other" && (
                        <div>
                          <label className="block text-sm font-medium text-white/90 mb-2">
                            Custom Type
                          </label>
                          <input
                            type="text"
                            value={pet.customType || ""}
                            onChange={(e) =>
                              updatePet(index, "customType", e.target.value)
                            }
                            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                            placeholder="e.g., Hamster"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Size (Optional)
                        </label>
                        <select
                          value={pet.size || ""}
                          onChange={(e) =>
                            updatePet(
                              index,
                              "size",
                              e.target.value || undefined
                            )
                          }
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                        >
                          <option value="">Not specified</option>
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPet}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-200"
                >
                  Add Pet Type
                </button>
              </div>
            )}
          </div>

          {/* Smoking Area */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Other
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smoking_area"
                checked={formData.smoking_area}
                onChange={(e) =>
                  setFormData({ ...formData, smoking_area: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="smoking_area"
                className="text-sm font-medium text-white/90"
              >
                Has Smoking Area
              </label>
            </div>
          </div>

          {/* Metro Stations */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Metro Stations
            </h4>

            {formData.metro_stations.map((station, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={station.label}
                  onChange={(e) =>
                    updateMetroStation(index, "label", e.target.value)
                  }
                  className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  placeholder="Station name"
                  required
                />
                <input
                  type="number"
                  value={station.destination}
                  onChange={(e) =>
                    updateMetroStation(
                      index,
                      "destination",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  placeholder="min"
                  min="0"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeMetroStation(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addMetroStation}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
            >
              Add Metro Station
            </button>
          </div>

          {/* Commute Times */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Commute Times
            </h4>

            {formData.commute_times.map((time, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={time.label}
                  onChange={(e) =>
                    updateCommuteTime(index, "label", e.target.value)
                  }
                  className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  placeholder="Destination"
                  required
                />
                <input
                  type="number"
                  value={time.destination}
                  onChange={(e) =>
                    updateCommuteTime(
                      index,
                      "destination",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  placeholder="min"
                  min="0"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeCommuteTime(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addCommuteTime}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
            >
              Add Commute Time
            </button>
          </div>

          {/* Local Essentials */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Local Essentials
            </h4>

            {formData.local_essentials.map((essential, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={essential.label}
                  onChange={(e) =>
                    updateLocalEssential(index, "label", e.target.value)
                  }
                  className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  placeholder="Essential name"
                  required
                />
                <input
                  type="number"
                  value={essential.destination}
                  onChange={(e) =>
                    updateLocalEssential(
                      index,
                      "destination",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                  placeholder="m"
                  min="0"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeLocalEssential(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addLocalEssential}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
            >
              Add Local Essential
            </button>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 cursor-pointer text-white/90 hover:bg-white/10 rounded-lg transition-colors font-medium border border-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-white cursor-pointer text-black hover:bg-white/90 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Creating..." : "Create"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBuildingModal;
