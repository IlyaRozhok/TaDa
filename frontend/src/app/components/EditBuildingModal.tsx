"use client";

import React from "react";
import BuildingForm from "./BuildingForm";
import type { Building } from "@/store/api/buildings.api";
import {
  transformUnitTypeUIToAPI,
  transformTenantTypeUIToAPI,
} from "@/constants/mappings";
import type {
  BuildingFormData,
  BuildingUploadResult,
  EditMediaState,
} from "./BuildingForm/types";

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
  if (!building) return null;

  /**
   * Edit-mode payload builder, moved verbatim out of the old monolith's
   * handleSubmit. Unlike create, it merges existing media with uploads
   * (honouring the removed-media flags), always sends description so
   * clearing it persists as empty, and never resets the form after.
   */
  const buildEditBuildingPayload = (
    formData: BuildingFormData,
    uploadResult: BuildingUploadResult,
    media: EditMediaState,
  ) => {
    const { removedPhotos, removedLogo, removedVideo, removedDocuments } =
      media;

    // Prepare data with uploaded URLs
    // For photos: combine existing (minus removed) + new uploaded
    const existingPhotos = (formData.photos || []).filter(
      (photo) => !removedPhotos.includes(photo),
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

    const buildingData: any = {
      name: formData.name,
      // Only send operator_id as string or null, never as object
      operator_id: operatorIdValue,
    };

    // Always send description so clearing it in the editor persists as empty
    buildingData.description =
      formData.description && formData.description.trim() !== ""
        ? formData.description
        : "";
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
    if (formData.amenities && formData.amenities.length > 0) {
      buildingData.amenities = formData.amenities;
    }
    if (formData.districts && formData.districts.length > 0) {
      buildingData.districts = formData.districts;
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

    console.log("📤 Submitting building data:", {
      id: building.id,
      operator_id: buildingData.operator_id,
      operator_id_type: typeof buildingData.operator_id,
      formData_operator_id: formData.operator_id,
      formData_operator_id_type: typeof formData.operator_id,
    });

    return buildingData;
  };

  return (
    <BuildingForm
      mode="edit"
      isOpen={isOpen}
      onClose={onClose}
      building={building}
      onSubmit={(data) => onSubmit(building.id, data)}
      isLoading={isLoading}
      buildPayload={buildEditBuildingPayload}
    />
  );
};

export default EditBuildingModal;
