"use client";

import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { AddPropertyModalProps, Pet } from "./types";
import { usePropertyForm } from "./hooks/usePropertyForm";
import { usePropertyValidation } from "./hooks/usePropertyValidation";
import { usePropertyData } from "./hooks/usePropertyData";
import { usePropertyFiles } from "./hooks/usePropertyFiles";
import { useDropdownHelpers } from "./hooks/useDropdownHelpers";
import { BasicInfoSection } from "./components/BasicInfoSection";
import { LocationSection } from "./components/LocationSection";
import { PropertyDetailsSection } from "./components/PropertyDetailsSection";
import { AmenitiesSection } from "./components/AmenitiesSection";
import { ConciergePetsSmokingSection } from "./components/ConciergePetsSmokingSection";
import { LocationDetailsSection } from "./components/LocationDetailsSection";
import { MediaSection } from "./components/MediaSection";
import { useLocalizedFormOptions } from "../../../shared/hooks/useLocalizedFormOptions";
import {
  transformTenantTypeUIToAPI,
  transformTenantTypeAPIToUI,
  transformDurationUIToAPIArray,
} from "../../../shared/constants/mappings";
import { propertiesAPI } from "../../lib/api";

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  operators = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevBuildingType, setPrevBuildingType] = useState<string | null>(null);

  // Hooks
  const { formData, updateFormData, resetForm } = usePropertyForm();
  const {
    errors,
    touched,
    validate,
    validateAll,
    setFieldTouched,
    clearErrors,
  } = usePropertyValidation();
  const {
    buildings,
    selectedBuilding,
    setSelectedBuilding,
    availableOperators,
    operatorsLoading,
    loadOperators,
    findBuildingById,
  } = usePropertyData(operators);
  const {
    photoFiles,
    videoFile,
    documentFile,
    photoPreviews,
    videoPreview,
    documentPreview,
    photoInputRef,
    videoInputRef,
    documentInputRef,
    handlePhotoUpload,
    removePhoto,
    handleVideoUpload,
    handleDocumentUpload,
    resetFiles,
  } = usePropertyFiles();
  const dropdownHelpers = useDropdownHelpers(formData, updateFormData);

  const { tenantTypeOptions } = useLocalizedFormOptions();

  // Preload operators once so dropdown is ready when user selects Private Landlord
  useEffect(() => {
    loadOperators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load operators when building_type changes to private_landlord
  useEffect(() => {
    if (formData.building_type === "private_landlord") {
      loadOperators();
    }
  }, [formData.building_type]);

  // When building_type changes, clear inherited fields and building_id/operator_id
  useEffect(() => {
    if (
      prevBuildingType !== null &&
      prevBuildingType !== formData.building_type
    ) {
      const clearedData = {
        building_id: "",
        operator_id: "",
        address: "",
        tenant_types: [] as string[],
        amenities: [],
        is_concierge: false,
        concierge_hours: null,
        pet_policy: false,
        pets: null as Pet[] | null,
        smoking_area_prop: false,
        metro_stations: [],
        commute_times: [],
        local_essentials: [],
      };

      if (formData.building_type !== "private_landlord") {
        // Keep address empty for non-private landlord
        clearedData.address = "";
      }

      updateFormData(clearedData);
    }
    setPrevBuildingType(formData.building_type);
  }, [formData.building_type, prevBuildingType, updateFormData]);

  // Update selectedBuilding when building_id changes
  useEffect(() => {
    if (formData.building_id) {
      const building = findBuildingById(formData.building_id);
      setSelectedBuilding(building);
    } else {
      setSelectedBuilding(null);
    }
  }, [formData.building_id, findBuildingById, setSelectedBuilding]);

  // Load building details and populate inherited fields when a building is selected
  useEffect(() => {
    if (!selectedBuilding || formData.building_type === "private_landlord") {
      return;
    }
    const inheritedData = {
      address: selectedBuilding.address ?? "",
      tenant_types: transformTenantTypeAPIToUI(
        selectedBuilding.tenant_type || [],
      ),
      amenities: selectedBuilding.amenities || [],
      is_concierge: selectedBuilding.is_concierge ?? false,
      concierge_hours: selectedBuilding.concierge_hours ?? null,
      pet_policy: selectedBuilding.pet_policy ?? false,
      pets: selectedBuilding.pets ?? null,
      smoking_area_prop: selectedBuilding.smoking_area ?? false,
      metro_stations: selectedBuilding.metro_stations || [],
      commute_times: selectedBuilding.commute_times || [],
      local_essentials: selectedBuilding.local_essentials || [],
      operator_id: selectedBuilding.operator_id,
    };
    updateFormData(inheritedData);
  }, [selectedBuilding, formData.building_type, updateFormData]);

  const handleClose = () => {
    if (!isLoading && !isSubmitting) {
      resetForm();
      clearErrors();
      resetFiles();
      onClose();
    }
  };

  const handleFormFieldChange = (field: string, value: any) => {
    const error = validate(field, value, formData);
    updateFormData({ [field]: value });
  };

  const handleFieldBlur = (field: string) => {
    setFieldTouched(field, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading || isSubmitting) return;

    const isValid = validateAll(formData);
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedPhotoUrls: string[] = [];
      let uploadedVideoUrl = "";
      let uploadedDocUrl = "";

      if (photoFiles.length > 0) {
        const photoResults = await propertiesAPI.uploadPhotos(photoFiles);
        uploadedPhotoUrls = Array.isArray(photoResults)
          ? photoResults.map((r: { url?: string }) => r.url).filter(Boolean)
          : [];
      }
      if (videoFile) {
        const videoResult = await propertiesAPI.uploadVideo(videoFile);
        if (videoResult?.url) uploadedVideoUrl = videoResult.url;
      }
      if (documentFile) {
        const docResult = await propertiesAPI.uploadDocuments(documentFile);
        if (docResult?.url) uploadedDocUrl = docResult.url;
      }

      const normalizeNumber = (
        value: number | null | undefined | string,
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
        return isNaN(num) || num < 0 ? null : num;
      };

      const propertyData: any = {
        title: formData.title?.trim() || "",
        apartment_number: formData.apartment_number?.trim() || null,
        descriptions: formData.descriptions?.trim() || null,
        price: normalizeNumber(formData.price),
        deposit: normalizeNumber(formData.deposit),
        bedrooms: normalizeNumber(formData.bedrooms),
        bathrooms: normalizeNumber(formData.bathrooms),
        floor: normalizeNumber(formData.floor),
        square_meters: normalizeNumber(formData.square_meters),
        property_type: formData.property_type || null,
        building_type: formData.building_type || null,
        furnishing: formData.furnishing || null,
        let_duration:
          (formData.let_duration?.length ?? 0) > 0
            ? transformDurationUIToAPIArray(formData.let_duration)
            : null,
        bills: formData.bills || null,
        available_from: formData.available_from || null,
        outdoor_space: formData.outdoor_space,
        balcony: formData.balcony,
        terrace: formData.terrace,
        luxury: formData.luxury,
        address: formData.address || null,
        tenant_types: [
          ...new Set(transformTenantTypeUIToAPI(formData.tenant_types || [])),
        ],
        amenities: formData.amenities || [],
        is_concierge: formData.is_concierge,
        concierge_hours: formData.concierge_hours || null,
        pet_policy: formData.pet_policy,
        pets: formData.pets || null,
        smoking_area: formData.smoking_area_prop,
        metro_stations: formData.metro_stations || [],
        commute_times: formData.commute_times || [],
        local_essentials: formData.local_essentials || [],
        photos: [...(formData.photos || []), ...uploadedPhotoUrls],
        video: uploadedVideoUrl || formData.video || null,
        documents: uploadedDocUrl || formData.documents || null,
      };

      if (formData.building_type === "private_landlord") {
        propertyData.operator_id = formData.operator_id;
        propertyData.building_id = null;
      } else if (formData.building_type) {
        propertyData.building_id = formData.building_id;
        propertyData.operator_id =
          selectedBuilding?.operator_id || formData.operator_id || null;
      }

      await onSubmit(propertyData);
      handleClose();
    } catch (error) {
      console.error("Failed to submit property:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[8px] flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-black/50 backdrop-blur-[19px] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Add New Property 2</h2>
          <button
            onClick={handleClose}
            disabled={isLoading || isSubmitting}
            className="p-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
          style={{
            pointerEvents: isLoading || isSubmitting ? "none" : "auto",
            opacity: isLoading || isSubmitting ? 0.7 : 1,
          }}
        >
          {/* Basic Information */}
          <BasicInfoSection
            formData={formData}
            errors={errors}
            touched={touched}
            availableOperators={availableOperators}
            operatorsLoading={operatorsLoading}
            buildings={buildings}
            openDropdown={dropdownHelpers.openDropdown}
            onFieldChange={handleFormFieldChange}
            onFieldBlur={handleFieldBlur}
            onToggleDropdown={dropdownHelpers.toggleDropdown}
          />

          {/* Location and pricing */}
          <LocationSection
            formData={formData}
            errors={errors}
            touched={touched}
            openDropdown={dropdownHelpers.openDropdown}
            onFieldChange={handleFormFieldChange}
            onFieldBlur={handleFieldBlur}
            onToggleDropdown={dropdownHelpers.toggleDropdown}
          />

          {/* Property details */}
          <PropertyDetailsSection
            formData={formData}
            errors={errors}
            touched={touched}
            openDropdown={dropdownHelpers.openDropdown}
            onFieldChange={handleFormFieldChange}
            onFieldBlur={handleFieldBlur}
            onToggleDropdown={dropdownHelpers.toggleDropdown}
          />

          {/* Amenities */}
          <AmenitiesSection
            formData={formData}
            errors={errors}
            openDropdown={dropdownHelpers.openDropdown}
            onFieldChange={handleFormFieldChange}
            onToggleDropdown={dropdownHelpers.toggleDropdown}
          />

          {/* Concierge, Pets, Smoking */}
          <ConciergePetsSmokingSection
            formData={formData}
            openDropdown={dropdownHelpers.openDropdown}
            onFieldChange={handleFormFieldChange}
            onToggleDropdown={dropdownHelpers.toggleDropdown}
            addPet={dropdownHelpers.addPet}
            updatePet={dropdownHelpers.updatePet}
            removePet={dropdownHelpers.removePet}
          />

          {/* Metro, Commute, Local Essentials */}
          <LocationDetailsSection
            formData={formData}
            onFieldChange={handleFormFieldChange}
            addMetroStation={dropdownHelpers.addMetroStation}
            updateMetroStation={dropdownHelpers.updateMetroStation}
            removeMetroStation={dropdownHelpers.removeMetroStation}
            addCommuteTime={dropdownHelpers.addCommuteTime}
            updateCommuteTime={dropdownHelpers.updateCommuteTime}
            removeCommuteTime={dropdownHelpers.removeCommuteTime}
            addLocalEssential={dropdownHelpers.addLocalEssential}
            updateLocalEssential={dropdownHelpers.updateLocalEssential}
            removeLocalEssential={dropdownHelpers.removeLocalEssential}
          />

          {/* Media */}
          <MediaSection
            photoInputRef={photoInputRef}
            videoInputRef={videoInputRef}
            documentInputRef={documentInputRef}
            photoPreviews={photoPreviews}
            videoPreview={videoPreview}
            documentFile={documentFile}
            onPhotoChange={handlePhotoUpload}
            onRemovePhoto={removePhoto}
            onVideoChange={(e) => {
              if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]);
            }}
            onDocumentChange={(e) => {
              if (e.target.files?.[0]) handleDocumentUpload(e.target.files[0]);
            }}
            onClearVideo={() => {
              handleVideoUpload(null);
              if (videoInputRef.current) videoInputRef.current.value = "";
            }}
            onClearDocument={() => {
              handleDocumentUpload(null);
              if (documentInputRef.current) documentInputRef.current.value = "";
            }}
          />

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading || isSubmitting}
              className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save Property"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;
