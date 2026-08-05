"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import type { BuildingFormProps } from "./types";
import { useBuildingForm } from "./hooks/useBuildingForm";
import { useBuildingValidation } from "./hooks/useBuildingValidation";
import { useBuildingData } from "./hooks/useBuildingData";
import { useBuildingFiles } from "./hooks/useBuildingFiles";
import { useDropdownHelpers } from "./hooks/useDropdownHelpers";
import { BasicInfoSection } from "./components/BasicInfoSection";
import { TenantTargetingSection } from "./components/TenantTargetingSection";
import { MediaSection } from "./components/MediaSection";
import { AmenitiesSection } from "./components/AmenitiesSection";
import { PetPolicySection } from "./components/PetPolicySection";
import { MetroStationsSection } from "./components/MetroStationsSection";
import { AreasDistrictsSection } from "./components/AreasDistrictsSection";

const BuildingForm: React.FC<BuildingFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  mode,
  buildPayload,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { formData, setFormData, resetForm } = useBuildingForm();
  const {
    errors,
    touched,
    validateAll,
    validate,
    setFieldTouched,
    clearErrors,
  } = useBuildingValidation();
  const { operators, operatorsLoading } = useBuildingData(isOpen);
  const {
    logoFile,
    setLogoFile,
    videoFile,
    setVideoFile,
    photoFiles,
    setPhotoFiles,
    documentFiles,
    setDocumentFiles,
    logoPreview,
    videoPreview,
    photoPreviews,
    documentPreviews,
    photoInputRef,
    uploadAllFiles,
    resetFiles,
  } = useBuildingFiles();
  const {
    openDropdown,
    setOpenDropdown,
    toggleDropdown,
    addMetroStation,
    removeMetroStation,
    updateMetroStation,
    addPet,
    removePet,
    updatePet,
  } = useDropdownHelpers(setFormData);

  // Handle field changes with validation
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validate(field, value);
    }
  };

  const handleFieldBlur = (field: string) => {
    setFieldTouched(field, true);
    validate(field, formData[field as keyof typeof formData]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      return;
    }

    // Validate all fields
    const isValid = validateAll(formData);
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload files first
      const uploadResult = await uploadAllFiles();

      // The thin modal wrapper owns the mode-specific payload shape
      const buildingData = buildPayload(formData, uploadResult);

      await onSubmit(buildingData);
      if (!isLoading) {
        resetForm();
        resetFiles();
        clearErrors();
      }
    } catch (error) {
      console.error("Error submitting building:", error);
      throw error;
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
          <h2 className="text-2xl font-bold text-white">
            {mode === "edit" ? "Edit Building" : "Add New Building"}
          </h2>
          <button
            onClick={onClose}
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
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BasicInfoSection
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                touched={touched}
                openDropdown={openDropdown}
                onFieldChange={handleFieldChange}
                onFieldBlur={handleFieldBlur}
                onToggleDropdown={toggleDropdown}
              />

              <TenantTargetingSection
                formData={formData}
                setFormData={setFormData}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                onToggleDropdown={toggleDropdown}
                operators={operators}
                operatorsLoading={operatorsLoading}
              />
            </div>
          </div>

          {/* Media */}
          <MediaSection
            logoFile={logoFile}
            setLogoFile={setLogoFile}
            videoFile={videoFile}
            setVideoFile={setVideoFile}
            photoFiles={photoFiles}
            setPhotoFiles={setPhotoFiles}
            documentFiles={documentFiles}
            setDocumentFiles={setDocumentFiles}
            logoPreview={logoPreview}
            videoPreview={videoPreview}
            photoPreviews={photoPreviews}
            documentPreviews={documentPreviews}
            photoInputRef={photoInputRef}
          />

          {/* Amenities */}
          <AmenitiesSection
            formData={formData}
            setFormData={setFormData}
            openDropdown={openDropdown}
            onToggleDropdown={toggleDropdown}
          />

          {/* Pets */}
          <PetPolicySection
            formData={formData}
            setFormData={setFormData}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            onToggleDropdown={toggleDropdown}
            addPet={addPet}
            updatePet={updatePet}
            removePet={removePet}
          />

          {/* Metro Stations */}
          <MetroStationsSection
            formData={formData}
            addMetroStation={addMetroStation}
            updateMetroStation={updateMetroStation}
            removeMetroStation={removeMetroStation}
          />

          {/* Areas and Districts */}
          <AreasDistrictsSection
            formData={formData}
            setFormData={setFormData}
            openDropdown={openDropdown}
            onToggleDropdown={toggleDropdown}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isSubmitting}
              className="px-6 py-2.5 cursor-pointer text-white/90 hover:bg-white/10 rounded-lg transition-colors font-medium border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid={
                mode === "edit"
                  ? "building-edit-submit"
                  : "building-modal-submit"
              }
              disabled={isLoading || isSubmitting}
              className="px-6 py-2.5 bg-white cursor-pointer text-black hover:bg-white/90 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>{mode === "edit" ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <span>{mode === "edit" ? "Update" : "Create"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuildingForm;
