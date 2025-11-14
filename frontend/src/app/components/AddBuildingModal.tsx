"use client";

import React, { useState, useEffect } from "react";
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
    number_of_units: 1,
    type_of_unit: "studio" as
      | "studio"
      | "1-bed"
      | "2-bed"
      | "3-bed"
      | "Duplex"
      | "penthouse",
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
    tenant_type: "family" as
      | "corporateLets"
      | "sharers"
      | "student"
      | "family"
      | "elder",
    operator_id: "",
  });

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  // Operators state
  const [operators, setOperators] = useState<Operator[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  // Load operators when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadOperators = async () => {
        setOperatorsLoading(true);
        try {
          const response = await usersAPI.getAll();
          // Filter only operators
          const operatorsList = response.data.users?.filter((user: any) => user.role === 'operator') || [];
          setOperators(operatorsList);
        } catch (error) {
          console.error('Failed to load operators:', error);
          toast.error('Failed to load operators');
        } finally {
          setOperatorsLoading(false);
        }
      };

      loadOperators();
    }
  }, [isOpen]);

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

    // Prepare data with uploaded URLs
    const buildingData = {
      ...formData,
      logo: uploadResult.uploadedUrls.logo || formData.logo,
      video: uploadResult.uploadedUrls.video || formData.video,
      photos:
        uploadResult.uploadedUrls.photos.length > 0
          ? uploadResult.uploadedUrls.photos
          : formData.photos,
      documents: uploadResult.uploadedUrls.documents || formData.documents,
    };

    await onSubmit(buildingData);
    if (!isLoading) {
      // Reset form
      setFormData({
        name: "",
        address: "",
        number_of_units: 1,
        type_of_unit: "studio",
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
        tenant_type: "family",
        operator_id: "",
      });

      // Reset file states
      setLogoFile(null);
      setVideoFile(null);
      setPhotoFiles([]);
      setDocumentFiles([]);
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
    "SLA Maintenance",
    "Events calendar",
    "Pet areas",
    "Kids' room",
    "Garden"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-black">Add Building</h3>
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
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Units *
                </label>
                <input
                  type="number"
                  value={formData.number_of_units}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      number_of_units: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Unit *
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
                  required
                >
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
                  Tenant Type *
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
                  required
                >
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
                  value={formData.operator_id}
                  onChange={(e) =>
                    setFormData({ ...formData, operator_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  disabled={operatorsLoading}
                >
                  <option value="">
                    {operatorsLoading ? "Loading operators..." : "Select an operator"}
                  </option>
                  {operators.map((operator) => (
                    <option key={operator.id} value={operator.id}>
                      {operator.operatorProfile?.company_name ||
                       operator.operatorProfile?.full_name ||
                       operator.full_name ||
                       operator.email}
                    </option>
                  ))}
                </select>
                {!operatorsLoading && operators.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No operators available</p>
                )}
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
              Media Files (Optional)
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
                    Upload a logo image file (PNG, JPG, etc.)
                  </p>
                  {logoFile && (
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
                    Upload a video file (MP4, AVI, etc.)
                  </p>
                  {videoFile && (
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
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setPhotoFiles(files);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    Upload multiple photo files (PNG, JPG, etc.)
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
                      <div className="grid grid-cols-2 gap-2">
                        {photoFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 text-xs text-gray-600"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setPhotoFiles((prev) =>
                                  prev.filter((_, i) => i !== index)
                                )
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
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
                    Upload PDF document files
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
                      <div className="grid grid-cols-2 gap-2">
                        {documentFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 text-xs text-gray-600"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setDocumentFiles((prev) =>
                                  prev.filter((_, i) => i !== index)
                                )
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
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
                      <h5 className="font-medium">Pet {index + 1}</h5>
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
              Metro Stations *
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
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              Add Metro Station
            </button>
          </div>

          {/* Commute Times */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
              Commute Times *
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
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              Add Commute Time
            </button>
          </div>

          {/* Local Essentials */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
              Local Essentials *
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
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
              {isLoading ? "Creating..." : "Create Building"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBuildingModal;
