"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Upload, Trash2 } from "lucide-react";
import { propertiesAPI, buildingsAPI } from "../lib/api";
import {
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

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    apartment_number: "",
    description: "",
    price: null as number | null,
    deposit: null as number | null,
    available_from: null,
    bills: "" as Bills | "",
    property_type: "" as PropertyType | "",
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    building_type: "" as BuildingType | "",
    luxury: false,
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

  // File states
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Preview URLs
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  // Refs for file inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

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

  // Photo previews
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

  // Video preview
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

  // Document preview
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

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      throw new Error("Please enter a property title");
    }

    if (!formData.building_id) {
      throw new Error("Please select a building");
    }

    try {
      // Upload media files first
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

      // Don't send operator_id - it will be automatically set from building on backend
      const propertyData = {
        ...formData,
        photos: uploadedPhotos,
        video: uploadedVideo,
        documents: uploadedDocuments,
      };

      console.log(
        "📤 Sending propertyData:",
        JSON.stringify(propertyData, null, 2)
      );
      await onSubmit(propertyData);
      // Don't show toast here - let the parent component handle notifications
      handleClose();
    } catch (error: any) {
      console.error("Failed to create property:", error);
      // Re-throw error so parent component can handle it
      // Don't close modal on error - let user see the error
      throw error;
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      apartment_number: "",
      description: "",
      price: null as number | null,
      deposit: null as number | null,
      available_from: "",
      bills: "" as Bills | "",
      property_type: "" as PropertyType | "",
      bedrooms: null as number | null,
      bathrooms: null as number | null,
      building_type: "" as BuildingType | "",
      luxury: false,
      furnishing: "" as Furnishing | "",
      let_duration: "" as LetDuration | "",
      floor: null as number | null,
      outdoor_space: false,
      balcony: false,
      terrace: false,
      square_meters: null as number | null,
      photos: [],
      video: "",
      documents: "",
      building_id: "",
    });
    setPhotoFiles([]);
    setVideoFile(null);
    setDocumentFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[8px] flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-black/50 backdrop-blur-[19px] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Add New Property</h2>
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
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                placeholder="e.g. Modern 2BR Apartment"
                required
              />
            </div>

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
                <option value="" className="bg-black/80 text-white">
                  Select Building
                </option>
                {buildings.map((building) => (
                  <option
                    key={building.id}
                    value={building.id}
                    className="bg-black/80 text-white"
                  >
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
                value={formData.available_from}
                onChange={(e) =>
                  setFormData({ ...formData, available_from: e.target.value })
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
                <option value="" className="bg-black/80 text-white">
                  Select Type
                </option>
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
                <option value="" className="bg-black/80 text-white">
                  Select Type
                </option>
                {Object.values(BuildingType)
                  .filter(type => type !== "luxury") // Remove luxury from dropdown
                  .map((type) => (
                  <option key={type} value={type}>
                    {type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-white/90">
                <input
                  type="checkbox"
                  checked={formData.luxury}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      luxury: e.target.checked,
                    })
                  }
                  className="rounded border-white/20 bg-white/10 text-white focus:ring-white/50"
                />
                <span className="text-sm font-medium">Luxury Property</span>
              </label>
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
                <option value="" className="bg-black/80 text-white">
                  Select Type
                </option>
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
                <option value="" className="bg-black/80 text-white">
                  Select Duration
                </option>
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
                <option value="" className="bg-black/80 text-white">
                  Select Option
                </option>
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
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white"
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
                className="w-4 h-4 text-white border-white/30 rounded focus:ring-white/50 bg-white/10"
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
                className="w-4 h-4 text-white border-white/30 rounded focus:ring-white/50 bg-white/10"
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
                className="w-4 h-4 text-white border-white/30 rounded focus:ring-white/50 bg-white/10"
              />
              <span className="text-sm text-white/90">Terrace</span>
            </label>
          </div>

          {/* Media Uploads */}
          <div className="space-y-4">
            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Photos
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
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
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
              <label className="block text-sm font-medium text-white/90 mb-2">
                Video
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
                    className="w-full h-32 object-cover rounded-lg"
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
              <label className="block text-sm font-medium text-white/90 mb-2">
                Documents (PDF)
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
                <div className="mt-2 flex items-center justify-between p-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg">
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
              className="px-6 py-2.5 cursor-pointer bg-white text-black hover:bg-white/90 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Creating..." : "Create"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;
