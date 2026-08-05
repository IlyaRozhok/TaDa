"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  buildingUnitTypeAPIToUI,
  transformTenantTypeAPIToUI,
} from "@/constants/mappings";
import type { BuildingFormProps } from "./types";
import { useBuildingForm } from "./hooks/useBuildingForm";
import { useBuildingValidation } from "./hooks/useBuildingValidation";
import { useBuildingData } from "./hooks/useBuildingData";
import { useBuildingFiles } from "./hooks/useBuildingFiles";
import { useDropdownHelpers } from "./hooks/useDropdownHelpers";
import { BasicInfoSection } from "./components/BasicInfoSection";
import { TenantTargetingSection } from "./components/TenantTargetingSection";
import { MediaSection } from "./components/MediaSection";
import { EditMediaSection } from "./components/EditMediaSection";
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
  building = null,
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
    setLogoPreview,
    videoPreview,
    setVideoPreview,
    photoPreviews,
    setPhotoPreviews,
    documentPreviews,
    setDocumentPreviews,
    removedPhotos,
    setRemovedPhotos,
    removedLogo,
    setRemovedLogo,
    removedVideo,
    setRemovedVideo,
    removedDocuments,
    setRemovedDocuments,
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
  } = useDropdownHelpers(setFormData, mode);

  // Edit mode: prefill from the building whenever the modal (re)opens.
  // The dependency list is deliberately narrower than the whole object,
  // exactly as it was in the monolith.
  useEffect(() => {
    if (mode !== "edit") return;
    if (building && isOpen) {
      console.log("📥 Loading building data into form:", {
        building_id: building.id,
        operator_id: building.operator_id,
        full_building: building,
      });

      setFormData({
        name: building.name || "",
        description: building.description || "",
        address: building.address || "",
        number_of_units: building.number_of_units || 1,
        type_of_unit: [
          ...new Set(
            buildingUnitTypeAPIToUI(
              (Array.isArray(building.type_of_unit)
                ? building.type_of_unit
                : building.type_of_unit != null
                  ? [building.type_of_unit]
                  : []) as string[],
            ),
          ),
        ],
        logo: building.logo || "",
        video: building.video || "",
        photos: building.photos || [],
        documents: building.documents || "",
        metro_stations: building.metro_stations || [],
        areas: [],
        amenities: building.amenities || [],
        pet_policy: building.pet_policy || false,
        pets: building.pets || null,
        tenant_type:
          transformTenantTypeAPIToUI(
            (Array.isArray(building.tenant_type)
              ? building.tenant_type
              : building.tenant_type != null
                ? [building.tenant_type]
                : []) as string[],
          ) || [],
        family_status: Array.isArray(building.family_status)
          ? building.family_status
          : [],
        occupation: Array.isArray(building.occupation)
          ? building.occupation
          : [],
        children: Array.isArray(building.children) ? building.children : [],
        districts: building.districts || [],
        operator_id: building.operator_id || null,
      });

      console.log(
        "✅ Form data initialized with operator_id:",
        building.operator_id || null,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, building?.id, building?.operator_id]);

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

    // Validate all fields — create mode only: the edit monolith never
    // validated, and a rule like the name pattern would start rejecting
    // buildings that already exist. Kept different on purpose.
    if (mode === "create") {
      const isValid = validateAll(formData);
      if (!isValid) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Upload files first
      const uploadResult = await uploadAllFiles();

      // The thin modal wrapper owns the mode-specific payload shape
      const buildingData = buildPayload(formData, uploadResult, {
        removedPhotos,
        removedLogo,
        removedVideo,
        removedDocuments,
      });

      await onSubmit(buildingData);
      // Edit mode never reset after submit — state is rebuilt by the
      // prefill effect on the next open. Kept different on purpose.
      if (mode === "create" && !isLoading) {
        resetForm();
        resetFiles();
        clearErrors();
      }
    } catch (error) {
      console.error(
        mode === "edit"
          ? "Error updating building:"
          : "Error submitting building:",
        error,
      );
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
                mode={mode}
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
          {mode === "edit" && building ? (
            <EditMediaSection
              building={building}
              formData={formData}
              setFormData={setFormData}
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
              setPhotoPreviews={setPhotoPreviews}
              documentPreviews={documentPreviews}
              removedPhotos={removedPhotos}
              setRemovedPhotos={setRemovedPhotos}
              removedLogo={removedLogo}
              setRemovedLogo={setRemovedLogo}
              removedVideo={removedVideo}
              setRemovedVideo={setRemovedVideo}
              removedDocuments={removedDocuments}
              setRemovedDocuments={setRemovedDocuments}
              photoInputRef={photoInputRef}
            />
          ) : (
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
          )}

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
            mode={mode}
          />

          {/* Metro Stations */}
          <MetroStationsSection
            formData={formData}
            addMetroStation={addMetroStation}
            updateMetroStation={updateMetroStation}
            removeMetroStation={removeMetroStation}
            mode={mode}
          />

          {/* Areas and Districts */}
          <AreasDistrictsSection
            formData={formData}
            setFormData={setFormData}
            openDropdown={openDropdown}
            onToggleDropdown={toggleDropdown}
            mode={mode}
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
