"use client";

import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { AddPropertyModalProps } from "./types";
import { usePropertyForm } from "./hooks/usePropertyForm";
import { usePropertyValidation } from "./hooks/usePropertyValidation";
import { usePropertyData } from "./hooks/usePropertyData";
import { usePropertyFiles } from "./hooks/usePropertyFiles";
import { useDropdownHelpers } from "./hooks/useDropdownHelpers";
import { BasicInfoSection } from "./components/BasicInfoSection";
import { LocationSection } from "./components/LocationSection";
import { useLocalizedFormOptions } from "../../../shared/hooks/useLocalizedFormOptions";
import {
  transformTenantTypeUIToAPI,
  transformDurationUIToAPIArray,
} from "../../../shared/constants/mappings";

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
  const { errors, touched, validate, validateAll, setFieldTouched, clearErrors } = usePropertyValidation();
  const { 
    buildings, 
    selectedBuilding, 
    setSelectedBuilding,
    availableOperators, 
    operatorsLoading,
    loadOperators,
    findBuildingById 
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
    resetFiles
  } = usePropertyFiles();
  const dropdownHelpers = useDropdownHelpers(formData, updateFormData);

  const { tenantTypeOptions } = useLocalizedFormOptions();

  // Load operators when building_type changes to private_landlord
  useEffect(() => {
    if (formData.building_type === "private_landlord") {
      loadOperators();
    }
  }, [formData.building_type]);

  // When building_type changes, clear inherited fields and building_id/operator_id
  useEffect(() => {
    if (prevBuildingType !== null && prevBuildingType !== formData.building_type) {
      const clearedData = {
        building_id: "",
        operator_id: "",
        address: "",
        tenant_type: [],
        amenities: [],
        is_concierge: false,
        concierge_hours: null,
        pet_policy: false,
        pets: [],
        smoking_area: false,
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
    if (selectedBuilding && formData.building_type !== "private_landlord") {
      const inheritedData = {
        address: selectedBuilding.address,
        tenant_type: selectedBuilding.tenant_type || [],
        amenities: selectedBuilding.amenities || [],
        is_concierge: selectedBuilding.is_concierge || false,
        concierge_hours: selectedBuilding.concierge_hours || null,
        pet_policy: selectedBuilding.pet_policy || false,
        pets: selectedBuilding.pets || [],
        smoking_area: selectedBuilding.smoking_area || false,
        metro_stations: selectedBuilding.metro_stations || [],
        commute_times: selectedBuilding.commute_times || [],
        local_essentials: selectedBuilding.local_essentials || [],
      };

      updateFormData(inheritedData);
    }
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
      // Transform data for API
      const transformedData = {
        ...formData,
        tenant_type: transformTenantTypeUIToAPI(formData.tenant_type),
        minimum_stay: transformDurationUIToAPIArray([formData.minimum_stay.toString()])[0],
        maximum_stay: transformDurationUIToAPIArray([formData.maximum_stay.toString()])[0],
      };

      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add form data
      Object.entries(transformedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value) || typeof value === 'object') {
            submitData.append(key, JSON.stringify(value));
          } else {
            submitData.append(key, String(value));
          }
        }
      });

      // Add files
      photoFiles.forEach((file, index) => {
        submitData.append(`photos`, file);
      });

      if (videoFile) {
        submitData.append('video', videoFile);
      }

      if (documentFile) {
        submitData.append('document', documentFile);
      }

      await onSubmit(submitData);
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
          <h2 className="text-2xl font-bold text-white">Add New Property</h2>
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
            openDropdown={dropdownHelpers.openDropdown}
            onFieldChange={handleFormFieldChange}
            onFieldBlur={handleFieldBlur}
            onToggleDropdown={dropdownHelpers.toggleDropdown}
          />

          {/* Location and Building */}
          <LocationSection
            formData={formData}
            errors={errors}
            touched={touched}
            buildings={buildings}
            openDropdown={dropdownHelpers.openDropdown}
            onFieldChange={handleFormFieldChange}
            onFieldBlur={handleFieldBlur}
            onToggleDropdown={dropdownHelpers.toggleDropdown}
          />

          {/* TODO: Add remaining sections */}
          {/* - Property Details (bedrooms, bathrooms, size, floor) */}
          {/* - Features (description, amenities, checkboxes) */}
          {/* - Concierge Section */}
          {/* - Pets Section */}
          {/* - Location Details (metro, commute, local) */}
          {/* - Media Section */}

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