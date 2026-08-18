"use client";

import React from "react";
import BuildingForm from "./BuildingForm";
import { transformUnitTypeUIToAPI, transformTenantTypeUIToAPI } from "@/constants/mappings";
import type {
  BuildingFormData,
  BuildingUploadResult,
} from "./BuildingForm/types";

interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Create-mode payload builder, moved verbatim out of the old monolith's
 * handleSubmit: operator_id normalization, then conditional field inclusion.
 */
const buildCreateBuildingPayload = (
  formData: BuildingFormData,
  uploadResult: BuildingUploadResult,
) => {
  // Ensure operator_id is only the ID string, not an object
  let operatorIdValue: string | null = null;
  if (formData.operator_id) {
    if (
      typeof formData.operator_id === "string" &&
      formData.operator_id.trim() !== ""
    ) {
      operatorIdValue = formData.operator_id.trim();
    } else {
      const operatorIdObj = formData.operator_id;
      // Check if it's an object with an 'id' property
      if (typeof operatorIdObj === "object" && operatorIdObj !== null) {
        // Use type assertion to check for 'id' property
        const objWithId = operatorIdObj as { id?: unknown };
        if (objWithId.id !== undefined && typeof objWithId.id === "string") {
          // If somehow an object was passed, extract the ID
          operatorIdValue = objWithId.id;
          console.warn(
            "⚠️ operator_id was an object, extracting ID:",
            operatorIdValue,
          );
        }
      }
    }
  }

  // Prepare data with uploaded URLs
  const buildingData: any = {
    name: formData.name,
    // Only send operator_id as string or null, never as object
    operator_id: operatorIdValue,
  };

  // Add optional fields only if they have values
  if (formData.description && formData.description.trim() !== "") {
    buildingData.description = formData.description;
  }
  if (formData.address && formData.address.trim() !== "") {
    buildingData.address = formData.address;
  }
  if (formData.number_of_units != null) {
    buildingData.number_of_units = formData.number_of_units;
  }
  buildingData.type_of_unit =
    (formData.type_of_unit?.length ?? 0) > 0
      ? [...new Set(transformUnitTypeUIToAPI(formData.type_of_unit || []))]
      : [];
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
  if (formData.areas && formData.areas.length > 0) {
    buildingData.areas = formData.areas;
  }
  if (formData.districts && formData.districts.length > 0) {
    buildingData.districts = formData.districts;
  }
  if (formData.amenities && formData.amenities.length > 0) {
    buildingData.amenities = formData.amenities;
  }
  // Boolean fields - always include, even if false
  buildingData.pet_policy = formData.pet_policy;
  if (formData.pets && formData.pets.length > 0) {
    buildingData.pets = formData.pets;
  }
  if (formData.tenant_type && formData.tenant_type.length > 0) {
    buildingData.tenant_type = [
      ...new Set(transformTenantTypeUIToAPI(formData.tenant_type)),
    ];
  }
  buildingData.family_status = [...new Set(formData.family_status || [])];
  buildingData.occupation = [...new Set(formData.occupation || [])];
  buildingData.children = [...new Set(formData.children || [])];

  console.log("📤 Submitting building data (Add):", {
    operator_id: buildingData.operator_id,
    operator_id_type: typeof buildingData.operator_id,
    formData_operator_id: formData.operator_id,
    formData_operator_id_type: typeof formData.operator_id,
  });

  return buildingData;
};

const AddBuildingModal: React.FC<AddBuildingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  return (
    <BuildingForm
      mode="create"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      isLoading={isLoading}
      buildPayload={buildCreateBuildingPayload}
    />
  );
};

export default AddBuildingModal;
