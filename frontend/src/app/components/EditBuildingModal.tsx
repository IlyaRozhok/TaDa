"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Plus, Minus, Upload } from "lucide-react";
import { buildingsAPI, usersAPI } from "../lib/api";
import toast from "react-hot-toast";

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
  metro_stations?: Array<{ label: string; destination: number }>;
  commute_times?: Array<{ label: string; destination: number }>;
  local_essentials?: Array<{ label: string; destination: number }>;
  amenities?: string[];
  is_concierge?: boolean;
  concierge_hours?: { from: number; to: number } | null;
  pet_policy?: boolean;
  pets?: Array<{
    type: "dog" | "cat" | "other";
    customType?: string;
    size?: "small" | "medium" | "large";
  }>;
  smoking_area?: boolean;
  tenant_type?: "corporateLets" | "sharers" | "student" | "family" | "elder";
  operator_id: string | null;
}

interface BuildingFormData {
  name: string;
  address: string;
  number_of_units: number | null;
  type_of_unit: string;
  logo?: string;
  video?: string;
  photos?: string[];
  documents?: string;
  metro_stations?: Array<{ label: string; destination: number }>;
  commute_times?: Array<{ label: string; destination: number }>;
  local_essentials?: Array<{ label: string; destination: number }>;
  amenities?: string[];
  is_concierge?: boolean;
  concierge_hours?: { from: number; to: number } | null;
  pet_policy?: boolean;
  pets?: Array<{
    type: "dog" | "cat" | "other";
    customType?: string;
    size?: "small" | "medium" | "large";
  }>;
  smoking_area?: boolean;
  tenant_type?:
    | "corporateLets"
    | "sharers"
    | "student"
    | "family"
    | "elder"
    | "";
  operator_id: string | null;
}

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

interface EditBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building | null;
  onSubmit: (id: string, data: any) => Promise<void>;
  isLoading?: boolean;
}

const EditBuildingModal: React.FC<EditBuildingModalProps> = ({
  isOpen,
  onClose,
  building,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<BuildingFormData>({
    name: "",
    address: "",
    number_of_units: null,
    type_of_unit: "",
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
    tenant_type: "",
    operator_id: null,
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

  // Track removed existing media
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [removedLogo, setRemovedLogo] = useState<boolean>(false);
  const [removedVideo, setRemovedVideo] = useState<boolean>(false);
  const [removedDocuments, setRemovedDocuments] = useState<boolean>(false);

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

  useEffect(() => {
    if (building && isOpen) {
      console.log("📥 Loading building data into form:", {
        building_id: building.id,
        operator_id: building.operator_id,
        full_building: building,
      });

      setFormData({
        name: building.name || "",
        address: building.address || "",
        number_of_units: building.number_of_units || 1,
        type_of_unit: (building.type_of_unit as any) || "studio",
        logo: building.logo || "",
        video: building.video || "",
        photos: building.photos || [],
        documents: building.documents || "",
        metro_stations: building.metro_stations || [],
        commute_times: building.commute_times || [],
        local_essentials: building.local_essentials || [],
        amenities: building.amenities || [],
        is_concierge: building.is_concierge || false,
        concierge_hours: building.concierge_hours || null,
        pet_policy: building.pet_policy || false,
        pets: building.pets || null,
        smoking_area: building.smoking_area || false,
        tenant_type: building.tenant_type || "family",
        operator_id: building.operator_id || null,
      });

      console.log(
        "✅ Form data initialized with operator_id:",
        building.operator_id || null
      );
      // Reset removed media when modal opens
      setRemovedPhotos([]);
      setRemovedLogo(false);
      setRemovedVideo(false);
      setRemovedDocuments(false);
      // Reset file states
      setLogoFile(null);
      setVideoFile(null);
      setPhotoFiles([]);
      setDocumentFiles([]);
      setLogoPreview(null);
      setVideoPreview(null);
      setPhotoPreviews([]);
      setDocumentPreviews([]);
    }
  }, [isOpen, building?.id, building?.operator_id]);

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
    if (!building) return;

    // Upload files first
    const uploadResult = await uploadAllFiles();

    // Prepare data with uploaded URLs
    // For photos: combine existing (minus removed) + new uploaded
    const existingPhotos = (formData.photos || []).filter(
      (photo) => !removedPhotos.includes(photo)
    );
    const allPhotos = [...existingPhotos, ...uploadResult.uploadedUrls.photos];

    // For logo: use new if uploaded, empty if removed, otherwise keep existing
    let finalLogo = formData.logo;
    if (uploadResult.uploadedUrls.logo) {
      finalLogo = uploadResult.uploadedUrls.logo;
    } else if (removedLogo) {
      finalLogo = "";
    }

    // For video: use new if uploaded, empty if removed, otherwise keep existing
    let finalVideo = formData.video;
    if (uploadResult.uploadedUrls.video) {
      finalVideo = uploadResult.uploadedUrls.video;
    } else if (removedVideo) {
      finalVideo = "";
    }

    // For documents: use new if uploaded, empty if removed, otherwise keep existing
    let finalDocuments = formData.documents;
    if (uploadResult.uploadedUrls.documents) {
      finalDocuments = uploadResult.uploadedUrls.documents;
    } else if (removedDocuments) {
      finalDocuments = "";
    }

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
    if (formData.type_of_unit && formData.type_of_unit !== "") {
      buildingData.type_of_unit = formData.type_of_unit;
    }
    if (finalLogo && finalLogo.trim() !== "") {
      buildingData.logo = finalLogo;
    }
    if (finalVideo && finalVideo.trim() !== "") {
      buildingData.video = finalVideo;
    }
    if (allPhotos && allPhotos.length > 0) {
      buildingData.photos = allPhotos;
    }
    if (finalDocuments && finalDocuments.trim() !== "") {
      buildingData.documents = finalDocuments;
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
    if (formData.tenant_type && formData.tenant_type !== "") {
      buildingData.tenant_type = formData.tenant_type;
    }

    console.log("📤 Submitting building data:", {
      id: building.id,
      operator_id: buildingData.operator_id,
      operator_id_type: typeof buildingData.operator_id,
      formData_operator_id: formData.operator_id,
      formData_operator_id_type: typeof formData.operator_id,
    });

    await onSubmit(building.id, buildingData);
  };

  if (!isOpen || !building) return null;

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-black">Edit Building</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Unit
                </label>
                <select
                  value={formData.type_of_unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type_of_unit: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Select Type</option>
                  <option value="studio">Studio</option>
                  <option value="1-bed">1-bed</option>
                  <option value="2-bed">2-bed</option>
                  <option value="3-bed">3-bed</option>
                  <option value="Duplex">Duplex</option>
                  <option value="penthouse">Penthouse</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant Type
                </label>
                <select
                  value={formData.tenant_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tenant_type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Select Type</option>
                  <option value="corporateLets">Corporate Lets</option>
                  <option value="sharers">Sharers</option>
                  <option value="student">Student</option>
                  <option value="family">Family</option>
                  <option value="elder">Elder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
              Media Files
            </h4>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo (Image File)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogoFile(file);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    Upload a new logo image file (PNG, JPG, etc.) - this will
                    replace the current logo
                  </p>
                  {logoFile && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">
                          {logoFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setLogoFile(null)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      {logoPreview && (
                        <div className="mt-2">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="max-w-xs max-h-32 object-contain border border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {building.logo && !logoFile && !removedLogo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">
                          Current logo:
                        </span>
                        <button
                          type="button"
                          onClick={() => setRemovedLogo(true)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2">
                        <img
                          src={building.logo}
                          alt="Current logo"
                          className="max-w-xs max-h-32 object-contain border border-gray-300 rounded-md"
                          onError={(e) => {
                            console.error("Failed to load current logo");
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {removedLogo && (
                    <div className="text-sm text-gray-500 italic">
                      Logo will be removed on save
                    </div>
                  )}
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video (Video File)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setVideoFile(file);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    Upload a new video file (MP4, AVI, etc.) - this will replace
                    the current video
                  </p>
                  {videoFile && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">
                          {videoFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVideoFile(null)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      {videoPreview && (
                        <div className="mt-2">
                          <video
                            src={videoPreview}
                            controls
                            className="max-w-md max-h-64 border border-gray-300 rounded-md"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                    </div>
                  )}
                  {building.video && !videoFile && !removedVideo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">
                          Current video:
                        </span>
                        <button
                          type="button"
                          onClick={() => setRemovedVideo(true)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2">
                        <video
                          src={building.video}
                          controls
                          className="max-w-md max-h-64 border border-gray-300 rounded-md"
                          onError={(e) => {
                            console.error("Failed to load current video");
                            e.currentTarget.style.display = "none";
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}
                  {removedVideo && (
                    <div className="text-sm text-gray-500 italic">
                      Video will be removed on save
                    </div>
                  )}
                </div>
              </div>

              {/* Photos Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos (Image Files)
                </label>
                <div className="space-y-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    Upload additional photo files (PNG, JPG, etc.) - these will
                    be added to existing photos
                  </p>
                  {photoFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">
                          {photoFiles.length} photo
                          {photoFiles.length > 1 ? "s" : ""} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhotoFiles([])}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {photoFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="relative border border-gray-300 rounded-md overflow-hidden group bg-gray-50"
                          >
                            <div className="relative w-full h-32 bg-gray-100">
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
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Upload className="w-8 h-8" />
                                </div>
                              )}
                              <div className="absolute inset- bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center z-10">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhotoFiles((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    )
                                  }
                                  className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-opacity"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className="p-2 bg-white">
                              <p className="text-xs text-gray-600 truncate">
                                {file.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {building.photos && building.photos.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">
                          Current photos:{" "}
                          {
                            building.photos.filter(
                              (p) => !removedPhotos.includes(p)
                            ).length
                          }{" "}
                          photo
                          {building.photos.filter(
                            (p) => !removedPhotos.includes(p)
                          ).length !== 1
                            ? "s"
                            : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {building.photos
                          .filter(
                            (photoUrl) => !removedPhotos.includes(photoUrl)
                          )
                          .map((photoUrl, index) => (
                            <div
                              key={`existing-photo-${photoUrl}`}
                              className="relative border border-gray-300 rounded-md overflow-hidden group bg-gray-50"
                            >
                              <div className="relative w-full h-32 bg-gray-100">
                                <img
                                  src={photoUrl}
                                  alt={`Current photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error(
                                      "Failed to load current photo"
                                    );
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                <div className="absolute inset-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center z-10">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRemovedPhotos((prev) => [
                                        ...prev,
                                        photoUrl,
                                      ]);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-opacity"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                              <div className="p-2 bg-white">
                                <p className="text-xs text-gray-600 truncate">
                                  Photo {index + 1}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                      {removedPhotos.length > 0 && (
                        <div className="text-sm text-gray-500 italic">
                          {removedPhotos.length} photo
                          {removedPhotos.length > 1 ? "s" : ""} marked for
                          removal
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documents (PDF Files)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setDocumentFiles(files);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    Upload additional PDF document files - these will be added
                    to existing documents
                  </p>
                  {documentFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">
                          {documentFiles.length} PDF file
                          {documentFiles.length > 1 ? "s" : ""} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setDocumentFiles([])}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {documentFiles.map((file, index) => (
                          <div
                            key={index}
                            className="relative border border-gray-300 rounded-md overflow-hidden group bg-gray-50"
                          >
                            <div className="flex flex-col items-center justify-center p-4 h-32">
                              <svg
                                className="w-12 h-12 text-red-600 mb-2"
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
                              <p className="text-xs text-gray-600 text-center truncate w-full px-2">
                                {file.name}
                              </p>
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setDocumentFiles((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-opacity"
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
                  {building.documents && !removedDocuments && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">
                          Current document:
                        </span>
                        <button
                          type="button"
                          onClick={() => setRemovedDocuments(true)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        <div className="relative border border-gray-300 rounded-md overflow-hidden group bg-gray-50">
                          <div className="flex flex-col items-center justify-center p-4 h-32">
                            <svg
                              className="w-12 h-12 text-red-600 mb-2"
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
                            <p className="text-xs text-gray-600 text-center truncate w-full px-2">
                              Current Document
                            </p>
                            <a
                              href={building.documents}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              View PDF
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {removedDocuments && (
                    <div className="text-sm text-gray-500 italic">
                      Document will be removed on save
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
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
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>

            {formData.amenities.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">
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
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
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
                className="text-sm font-medium text-gray-700"
              >
                Has Concierge Service
              </label>
            </div>

            {formData.is_concierge && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pets */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
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
                className="text-sm font-medium text-gray-700"
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
                      <h5 className="font-medium text-black">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={pet.type}
                          onChange={(e) =>
                            updatePet(index, "type", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        >
                          <option value="dog">Dog</option>
                          <option value="cat">Cat</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {pet.type === "other" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Custom Type
                          </label>
                          <input
                            type="text"
                            value={pet.customType || ""}
                            onChange={(e) =>
                              updatePet(index, "customType", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="e.g., Hamster"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Pet Type
                </button>
              </div>
            )}
          </div>

          {/* Smoking Area */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
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
                className="text-sm font-medium text-gray-700"
              >
                Has Smoking Area
              </label>
            </div>
          </div>

          {/* Metro Stations */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Station name"
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
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="min"
                  min="0"
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
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              Add Metro Station
            </button>
          </div>

          {/* Commute Times */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Destination"
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
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="min"
                  min="0"
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
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              Add Commute Time
            </button>
          </div>

          {/* Local Essentials */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Essential name"
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
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="m"
                  min="0"
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
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              Add Local Essential
            </button>
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? "Updating..." : "Update Building"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBuildingModal;
