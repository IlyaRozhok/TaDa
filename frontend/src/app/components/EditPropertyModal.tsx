"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Upload } from "lucide-react";
import { propertiesAPI, buildingsAPI } from "../lib/api";
import {
  Property,
  PropertyType,
  BuildingType,
  Furnishing,
  LetDuration,
  Bills,
} from "../types/property";

interface Building {
  id: string;
  name: string;
  address: string;
  operator_id: string;
}

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  property: Property | null;
  isLoading?: boolean;
}

const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  property,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    apartment_number: "",
    descriptions: "",
    price: null as number | null,
    deposit: null as number | null,
    available_from: null as string | null,
    bills: "" as Bills | "",
    property_type: "" as PropertyType | "",
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    building_type: "" as BuildingType | "",
    furnishing: "" as Furnishing | "",
    let_duration: "" as LetDuration | "",
    floor: null as number | null,
    outdoor_space: false,
    balcony: false,
    terrace: false,
    square_meters: null as number | null,
    photos: [] as string[],
    video: "",
    documents: "",
    building_id: "",
  });

  const [buildings, setBuildings] = useState<Building[]>([]);

  // File states for new uploads
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Preview URLs for new uploads
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  // Track removed existing media
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [removedVideo, setRemovedVideo] = useState(false);
  const [removedDocuments, setRemovedDocuments] = useState(false);

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Load property data when modal opens
  useEffect(() => {
    if (property && isOpen) {
      setFormData({
        apartment_number: property.apartment_number || "",
        descriptions: property.descriptions || "",
        price: property.price || null,
        deposit: property.deposit || null,
        available_from: property.available_from
          ? new Date(property.available_from).toISOString().split("T")[0]
          : null,
        bills: property.bills || "",
        property_type: property.property_type || "",
        bedrooms: property.bedrooms || null,
        bathrooms: property.bathrooms || null,
        building_type: property.building_type || "",
        furnishing: property.furnishing || "",
        let_duration: property.let_duration || "",
        floor: property.floor || null,
        outdoor_space: property.outdoor_space || false,
        balcony: property.balcony || false,
        terrace: property.terrace || false,
        square_meters: property.square_meters || null,
        photos: property.photos || [],
        video: property.video || "",
        documents: property.documents || "",
        building_id: property.building_id || "",
      });
      // Reset removed media
      setRemovedPhotos([]);
      setRemovedVideo(false);
      setRemovedDocuments(false);
      setPhotoFiles([]);
      setVideoFile(null);
      setDocumentFile(null);
    }
  }, [property, isOpen]);

  // Load buildings
  useEffect(() => {
    if (isOpen) {
      loadBuildings();
    }
  }, [isOpen]);

  const loadBuildings = async () => {
    try {
      const response = await buildingsAPI.getAll();
      const buildingsData = response.data?.data || response.data || [];
      setBuildings(buildingsData);
    } catch (error) {
      console.error("Failed to load buildings:", error);
    }
  };

  // Photo previews for new uploads
  useEffect(() => {
    if (photoFiles.length === 0) {
      setPhotoPreviews([]);
      return;
    }

    const objectUrls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoFiles]);

  // Video preview for new upload
  useEffect(() => {
    if (!videoFile) {
      setVideoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(videoFile);
    setVideoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [videoFile]);

  // Document preview for new upload
  useEffect(() => {
    if (!documentFile) {
      setDocumentPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(documentFile);
    setDocumentPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [documentFile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotoFiles((prev) => [...prev, ...newFiles]);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const removeNewPhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (photoUrl: string) => {
    setRemovedPhotos((prev) => [...prev, photoUrl]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!property) return;

    if (!formData.building_id) {
      throw new Error("Please select a building");
    }

    try {
      // Upload new media files
      let uploadedPhotos: string[] = [];
      let uploadedVideo = "";
      let uploadedDocuments = "";

      if (photoFiles.length > 0) {
        const photoResults = await propertiesAPI.uploadPhotos(photoFiles);
        uploadedPhotos = photoResults.map((r: any) => r.url);
      }

      if (videoFile) {
        const videoResult = await propertiesAPI.uploadVideo(videoFile);
        uploadedVideo = videoResult.url;
      }

      if (documentFile) {
        const docResult = await propertiesAPI.uploadDocuments(documentFile);
        uploadedDocuments = docResult.url;
      }

      // Combine existing (non-removed) photos with new uploads
      const existingPhotos = formData.photos.filter(
        (photo) => !removedPhotos.includes(photo)
      );
      const allPhotos = [...existingPhotos, ...uploadedPhotos];

      // Handle video - use new upload if exists, otherwise keep existing if not removed
      const finalVideo = uploadedVideo || (removedVideo ? "" : formData.video);

      // Handle documents - use new upload if exists, otherwise keep existing if not removed
      const finalDocuments =
        uploadedDocuments || (removedDocuments ? "" : formData.documents);

      // Normalize data before sending - ensure numbers are numbers, not strings
      const normalizeNumber = (
        value: number | null | undefined | string
      ): number | null => {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          value === "0"
        ) {
          return null;
        }
        const num = Number(value);
        return isNaN(num) || num <= 0 ? null : num;
      };

      // Build the property data object, ensuring all numeric fields are properly converted
      const propertyData: any = {
        building_id: formData.building_id,
        apartment_number: formData.apartment_number?.trim() || null,
        descriptions: formData.descriptions?.trim() || null,
        // Convert numeric fields to proper numbers or null
        price: normalizeNumber(formData.price),
        deposit: normalizeNumber(formData.deposit),
        bedrooms: normalizeNumber(formData.bedrooms),
        bathrooms: normalizeNumber(formData.bathrooms),
        floor: normalizeNumber(formData.floor),
        square_meters: normalizeNumber(formData.square_meters),
        // Optional enum fields
        property_type: formData.property_type || null,
        building_type: formData.building_type || null,
        furnishing: formData.furnishing || null,
        let_duration: formData.let_duration || null,
        bills: formData.bills || null,
        available_from: formData.available_from || null,
        // Boolean fields
        outdoor_space: formData.outdoor_space,
        balcony: formData.balcony,
        terrace: formData.terrace,
        // Media
        photos: allPhotos,
        video: finalVideo || null,
        documents: finalDocuments || null,
      };

      // Remove null values from optional fields (except for explicitly nullable fields like price, deposit)
      // But keep null for fields that backend expects to be nullable
      Object.keys(propertyData).forEach((key) => {
        if (propertyData[key] === "" || propertyData[key] === undefined) {
          propertyData[key] = null;
        }
      });

      await onSubmit(property.id, propertyData);
      handleClose();
    } catch (error: any) {
      console.error("Failed to update property:", error);
      // Re-throw error so parent component can handle it
      throw error;
    }
  };

  const handleClose = () => {
    setPhotoFiles([]);
    setVideoFile(null);
    setDocumentFile(null);
    setRemovedPhotos([]);
    setRemovedVideo(false);
    setRemovedDocuments(false);
    onClose();
  };

  if (!isOpen || !property) return null;

  // Filter out removed photos
  const displayPhotos = formData.photos.filter(
    (photo) => !removedPhotos.includes(photo)
  );

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[8px] flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-black/50 backdrop-blur-[19px] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Edit Property</h2>
          <button
            onClick={handleClose}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Apartment Number
              </label>
              <input
                type="text"
                value={formData.apartment_number}
                onChange={(e) =>
                  setFormData({ ...formData, apartment_number: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Building *
              </label>
              <select
                value={formData.building_id}
                onChange={(e) =>
                  setFormData({ ...formData, building_id: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                required
              >
                <option value="">Select Building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name} - {building.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Price (£ PCM)
              </label>
              <input
                type="number"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Deposit (£)
              </label>
              <input
                type="number"
                value={formData.deposit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deposit:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Available From
              </label>
              <input
                type="date"
                value={formData.available_from || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    available_from: e.target.value || null,
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Property Type
              </label>
              <select
                value={formData.property_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    property_type: e.target.value as PropertyType,
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              >
                <option value="">Select Type</option>
                {Object.values(PropertyType).map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Building Type
              </label>
              <select
                value={formData.building_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    building_type: e.target.value as BuildingType,
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              >
                <option value="">Select Type</option>
                {Object.values(BuildingType).map((type) => (
                  <option key={type} value={type}>
                    {type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Furnishing
              </label>
              <select
                value={formData.furnishing}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    furnishing: e.target.value as Furnishing,
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              >
                <option value="">Select Type</option>
                {Object.values(Furnishing).map((type) => (
                  <option key={type} value={type}>
                    {type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Let Duration
              </label>
              <select
                value={formData.let_duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    let_duration: e.target.value as LetDuration,
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              >
                <option value="">Select Duration</option>
                {Object.values(LetDuration).map((type) => (
                  <option key={type} value={type}>
                    {type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bills
              </label>
              <select
                value={formData.bills}
                onChange={(e) =>
                  setFormData({ ...formData, bills: e.target.value as Bills })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              >
                <option value="">Select Option</option>
                {Object.values(Bills).map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                value={formData.bedrooms || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bedrooms:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                value={formData.bathrooms || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bathrooms:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Floor
              </label>
              <input
                type="number"
                value={formData.floor || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    floor:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Square Meters
              </label>
              <input
                type="number"
                value={formData.square_meters || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    square_meters:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Description
            </label>
            <textarea
              value={formData.descriptions}
              onChange={(e) =>
                setFormData({ ...formData, descriptions: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              rows={4}
              placeholder="Describe the property..."
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.outdoor_space}
                onChange={(e) =>
                  setFormData({ ...formData, outdoor_space: e.target.checked })
                }
                className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
              />
              <span className="text-sm text-white/90">Outdoor Space</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.balcony}
                onChange={(e) =>
                  setFormData({ ...formData, balcony: e.target.checked })
                }
                className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
              />
              <span className="text-sm text-white/90">Balcony</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.terrace}
                onChange={(e) =>
                  setFormData({ ...formData, terrace: e.target.checked })
                }
                className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
              />
              <span className="text-sm text-white/90">Terrace</span>
            </label>
          </div>

          {/* Media Uploads */}
          <div className="space-y-4">
            {/* Existing Photos */}
            {displayPhotos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Current Photos
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {displayPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Current ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(photo)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Photos */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Add New Photos
              </label>
              <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
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
              {photoPreviews.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(index)}
                        className="absolute top-1 right-1 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video */}
            <div>
              {formData.video && !removedVideo && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Current Video
                  </label>
                  <div className="relative">
                    <video
                      src={formData.video}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                    <button
                      type="button"
                      onClick={() => setRemovedVideo(true)}
                      className="absolute top-1 right-1 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <label className="block text-sm font-medium text-white/90 mb-2">
                {formData.video && !removedVideo
                  ? "Replace Video"
                  : "Add Video"}
              </label>
              <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setVideoFile(e.target.files[0]);
                    }
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
              {videoPreview && (
                <div className="mt-2 relative">
                  <video
                    src={videoPreview}
                    className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
                    controls
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      if (videoInputRef.current) {
                        videoInputRef.current.value = "";
                      }
                    }}
                    className="absolute top-1 right-1 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              {formData.documents && !removedDocuments && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Current Document
                  </label>
                  <div className="flex items-center justify-between p-2 bg-slate-100 rounded-lg">
                    <a
                      href={formData.documents}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                    <button
                      type="button"
                      onClick={() => setRemovedDocuments(true)}
                      className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <label className="block text-sm font-medium text-white/90 mb-2">
                {formData.documents && !removedDocuments
                  ? "Replace Document"
                  : "Add Document"}
              </label>
              <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setDocumentFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-white/70 mb-2" />
                  <p className="text-sm text-white/90 font-medium">
                    Click to upload document
                  </p>
                  <p className="text-xs text-white/60 mt-1">PDF file</p>
                </div>
              </label>
              {documentFile && (
                <div className="mt-2 flex items-center justify-between p-2 bg-green-100 rounded-lg">
                  <span className="text-sm text-white/90">
                    {documentFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentFile(null);
                      if (documentInputRef.current) {
                        documentInputRef.current.value = "";
                      }
                    }}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 text-white/90 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-medium border border-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-white cursor-pointer text-black hover:bg-white/90 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Updating..." : "Update"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;
