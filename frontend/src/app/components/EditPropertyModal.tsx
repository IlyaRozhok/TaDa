"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { propertiesAPI } from "@/app/lib/api";
import { useLazyGetUsersQuery } from "@/store/api/users.api";
import {
  useGetBuildingsQuery,
  useLazyGetBuildingQuery,
} from "@/store/api/buildings.api";
import {
  Bills,
  BuildingType,
  Furnishing,
  Property,
  PropertyType,
} from "@/app/types/property";
import type { User } from "@/store/slices/authSlice";
import { useLocalizedFormOptions } from "@/shared/hooks/useLocalizedFormOptions";
import { useTranslation } from "@/app/hooks/useTranslation";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { sqMToSqFt } from "@/shared/lib/area";
import {
  transformTenantTypeUIToAPI,
  transformTenantTypeAPIToUI,
  transformDurationUIToAPIArray,
  transformDurationAPIToUIArray,
} from "@/constants/mappings";
import type {
  CommuteTime,
  EditPropertyFormData,
  LocalEssential,
  MetroStation,
  OperatorOption,
  Pet,
} from "@/app/components/PropertyForm/types";
import { useEditPropertyFiles } from "@/app/components/PropertyForm/hooks/useEditPropertyFiles";
import { EditBasicInfoSection } from "@/app/components/PropertyForm/components/EditBasicInfoSection";
import { EditTenantTargetingSection } from "@/app/components/PropertyForm/components/EditTenantTargetingSection";
import { EditPropertyDetailsSection } from "@/app/components/PropertyForm/components/EditPropertyDetailsSection";
import { EditAmenitiesSection } from "@/app/components/PropertyForm/components/EditAmenitiesSection";
import { EditPetPolicySection } from "@/app/components/PropertyForm/components/EditPetPolicySection";
import { EditMetroStationsSection } from "@/app/components/PropertyForm/components/EditMetroStationsSection";
import { EditPropertyMediaSection } from "@/app/components/PropertyForm/components/EditPropertyMediaSection";

const OCCUPATION_VALUES = [
  "student",
  "young-professional",
  "freelancer-remote-worker",
  "business-owner",
  "family-professional",
  "other",
];

const FAMILY_STATUS_VALUES = [
  "just-me",
  "couple",
  "couple-with-children",
  "single-parent",
  "friends-flatmates",
];

const CHILDREN_VALUES = [
  "no",
  "yes-1-child",
  "yes-2-children",
  "yes-3-plus-children",
];

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  property: Property | null;
  isLoading?: boolean;
  operators?: User[];
}

const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  property,
  isLoading = false,
  operators = [],
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EditPropertyFormData>({
    title: "",
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
    let_duration: [] as string[],
    floor: null as number | null,
    balcony: false,
    terrace: false,
    square_meters: null as number | null,
    // UI-only field: area entered in square feet. Converted to square_meters on submit.
    square_feet: null as number | null,
    photos: [] as string[],
    video: "",
    documents: "",
    building_id: "",
    // Inherited fields
    address: "",
    tenant_types: [] as string[],
    amenities: [] as string[],
    property_amenities: [] as string[],
    family_status: [] as string[],
    occupation: [] as string[],
    children: [] as string[],
    pets: null as Pet[] | null,
    pet_policy: false,
    metro_stations: [] as MetroStation[],
    commute_times: [] as CommuteTime[],
    local_essentials: [] as LocalEssential[],
    operator_id: "",
  });
  // The building dropdown, loaded only while the modal is open.
  const { data: buildingsData } = useGetBuildingsQuery(undefined, {
    skip: !isOpen,
  });
  const buildings = useMemo(() => buildingsData ?? [], [buildingsData]);
  // Imperative on purpose: the details are pulled for whichever building the
  // form points at, inside the effect that watches `building_id`.
  const [fetchBuilding] = useLazyGetBuildingQuery();

  const [availableOperators, setAvailableOperators] = useState<OperatorOption[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  // Lazy rather than a plain query: the loader below falls back to the
  // unfiltered list only when the role-filtered one comes back empty.
  const [fetchUsers] = useLazyGetUsersQuery();

  // Validation errors state
  const [buildingError, setBuildingError] = useState<string | null>(null);
  const [buildingTouched, setBuildingTouched] = useState(false);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const {
    photoFiles,
    setPhotoFiles,
    videoFile,
    setVideoFile,
    documentFile,
    setDocumentFile,
    photoPreviews,
    setPhotoPreviews,
    videoPreview,
    removedPhotos,
    setRemovedPhotos,
    removedVideo,
    setRemovedVideo,
    removedDocuments,
    setRemovedDocuments,
    photoInputRef,
    videoInputRef,
    documentInputRef,
    handlePhotoChange,
    removeNewPhoto,
    removeExistingPhoto,
  } = useEditPropertyFiles();

  // Localized options (same as preferences)
  const {
    propertyTypeOptions,
    tenantTypeOptions,
    durationOptions,
    furnishingOptions,
    buildingTypeOptions,
  } = useLocalizedFormOptions();

  // Load property data when modal opens
  useEffect(() => {
    if (property && isOpen) {
      console.log("📥 Загрузка данных property в EditPropertyModal:", {
        id: property.id,
        video: property.video,
        videoType: typeof property.video,
        videoLength: property.video?.length,
        fullProperty: property,
      });

      // Ensure arrays are properly parsed
      const parseArray = (value: any) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      const videoValue = property.video || "";
      console.log("🎬 Установка video в formData:", {
        original: property.video,
        final: videoValue,
        isEmpty: !videoValue,
      });

      setFormData({
        title: property.title || "",
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
        let_duration: transformDurationAPIToUIArray(
          property.let_duration || "",
        ),
        floor: property.floor || null,
        balcony: property.balcony || false,
        terrace: property.terrace || false,
        square_meters: property.square_meters || null,
        square_feet: property.square_meters
          ? sqMToSqFt(property.square_meters)
          : null,
        photos: property.photos || [],
        video: videoValue,
        documents: property.documents || "",
        building_id: property.building_id || "",
        // Inherited fields - parse arrays properly
        address: property.address || "",
        tenant_types: transformTenantTypeAPIToUI(
          parseArray(property.tenant_types),
        ),
        amenities: parseArray(property.amenities),
        property_amenities: parseArray((property as any).property_amenities),
        family_status: parseArray((property as any).family_status),
        occupation: parseArray((property as any).occupation),
        children: parseArray((property as any).children),
        pets: property.pets
          ? Array.isArray(property.pets)
            ? property.pets
            : []
          : null,
        pet_policy: property.pet_policy || false,
        metro_stations: parseArray(property.metro_stations),
        commute_times: parseArray(property.commute_times),
        local_essentials: parseArray(property.local_essentials),
        operator_id: property.operator_id || "",
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

  // Load operators when the modal opens on a private-landlord property; the
  // buildings list is a query above and needs no imperative trigger.
  useEffect(() => {
    if (isOpen && formData.building_type === "private_landlord") {
      loadOperators();
    }
  }, [isOpen]);

  // Load operators when building_type changes to private_landlord
  useEffect(() => {
    if (formData.building_type === "private_landlord" && isOpen) {
      loadOperators();
    }
  }, [formData.building_type]);

  // Use operators from props
  useEffect(() => {
    if (operators && operators.length > 0) {
      setAvailableOperators(operators);
    }
  }, [operators]);

  const loadOperators = async () => {
    try {
      console.log("🔄 Loading operators in EditPropertyModal...");
      console.log("🔍 Current formData.operator_id:", formData.operator_id);
      setOperatorsLoading(true);

      // Try to load operators with role filter first
      try {
        const operatorsData: OperatorOption[] = (
          await fetchUsers({ role: "operator" }).unwrap()
        ).users;
        console.log(
          "✅ Operators loaded with role filter:",
          operatorsData.length,
          "operators",
        );

        if (operatorsData.length > 0) {
          let finalOperators: OperatorOption[] = operatorsData;

          // If the current property's operator is not in the list, add it
          if (
            formData.operator_id &&
            !finalOperators.find((op) => op.id === formData.operator_id)
          ) {
            console.log(
              "⚠️ Current operator not found in list, adding it:",
              formData.operator_id,
            );
            console.log(
              "🔍 Available operators IDs:",
              finalOperators.map((op) => op.id),
            );
            finalOperators = [
              {
                id: formData.operator_id,
                full_name: `Operator ${formData.operator_id}`,
                email: "",
                role: "operator",
              },
              ...finalOperators,
            ];
          }

          console.log(
            "✅ Final operators set:",
            finalOperators.length,
            "operators",
          );
          setAvailableOperators(finalOperators);
          return;
        }
      } catch (operatorsError) {
        console.log(
          "⚠️ Failed to load operators with role filter:",
          operatorsError,
        );
      }

      // Fallback: load all users and filter
      console.log("🔍 Falling back to the unfiltered user list");
      const usersData = (await fetchUsers().unwrap()).users;
      console.log("✅ All users loaded:", usersData.length, "users");

      // Filter only operators
      const operatorsData = usersData.filter((user) => {
        const isOperator = user.role === "operator" || user.role === "Operator";
        console.log(
          "🔍 User",
          user.id,
          user.email,
          user.role,
          "-> isOperator:",
          isOperator,
        );
        return isOperator;
      });
      console.log("✅ Filtered operators:", operatorsData.length, "operators");

      let finalOperators: OperatorOption[] = operatorsData;

      // If no real operators found, use mock data
      if (operatorsData.length === 0) {
        console.log("⚠️ No real operators found, using mock data");
        finalOperators = [
          {
            id: "mock-op-1",
            full_name: "Test Operator 1",
            email: "operator1@test.com",
            role: "operator",
          },
          {
            id: "mock-op-2",
            full_name: "Test Operator 2",
            email: "operator2@test.com",
            role: "operator",
          },
        ];
      }

      // If the current property's operator is not in the list, add it
      if (
        formData.operator_id &&
        !finalOperators.find((op) => op.id === formData.operator_id)
      ) {
        console.log(
          "⚠️ Current operator not found in list, adding it:",
          formData.operator_id,
        );
        console.log(
          "🔍 Available operators IDs:",
          finalOperators.map((op) => op.id),
        );
        finalOperators = [
          {
            id: formData.operator_id,
            full_name: `Operator ${formData.operator_id}`,
            email: "",
            role: "operator",
          },
          ...finalOperators,
        ];
      }

      console.log(
        "✅ Final operators set:",
        finalOperators.length,
        "operators",
      );
      console.log("✅ Final operators:", finalOperators);
      setAvailableOperators(finalOperators);
    } catch (error) {
      console.error("❌ Failed to load operators:", error);
      setAvailableOperators([]);
    } finally {
      setOperatorsLoading(false);
    }
  };

  // Track previous building_type to detect changes
  const [prevBuildingType, setPrevBuildingType] = useState<string | null>(null);

  // When building_type changes from private_landlord to another type, clear inherited fields and building_id
  useEffect(() => {
    if (
      prevBuildingType === "private_landlord" &&
      formData.building_type !== "private_landlord"
    ) {
      // Switching away from private_landlord - clear inherited fields and building_id
      setFormData((prev) => ({
        ...prev,
        building_id: "", // Clear building selection
        address: "",
        tenant_types: [],
        amenities: [],
        property_amenities: [],
        family_status: [],
        occupation: [],
        children: [],
        pet_policy: false,
        pets: null,
        metro_stations: [],
        commute_times: [],
        local_essentials: [],
      }));
      setBuildingError(null);
      setBuildingTouched(false);
    } else if (
      prevBuildingType !== "private_landlord" &&
      formData.building_type === "private_landlord"
    ) {
      // Switching to private_landlord - clear building_id and make fields editable (empty)
      setFormData((prev) => ({
        ...prev,
        building_id: "",
        address: "",
        tenant_types: [],
        amenities: [],
        property_amenities: [],
        family_status: [],
        occupation: [],
        children: [],
        pet_policy: false,
        pets: null,
        metro_stations: [],
        commute_times: [],
        local_essentials: [],
      }));
      setBuildingError(null);
      setBuildingTouched(false);
    }
    setPrevBuildingType(formData.building_type);
  }, [formData.building_type]);

  // Load building details and populate inherited fields when a building is selected
  useEffect(() => {
    const loadBuildingDetails = async () => {
      if (
        formData.building_id &&
        formData.building_type !== "private_landlord" &&
        buildings.length > 0
      ) {
        try {
          const building = await fetchBuilding(
            formData.building_id,
          ).unwrap();
          if (building) {
            // Always populate from building when building is selected (for linked properties)
            setFormData((prev) => ({
              ...prev,
              address: building.address || "",
              tenant_types: transformTenantTypeAPIToUI(
                building.tenant_type || [],
              ),
              amenities: building.amenities || [],
              family_status: building.family_status || [],
              occupation: building.occupation || [],
              children: building.children || [],
              pet_policy: building.pet_policy || false,
              pets: building.pets || null,
              metro_stations: building.metro_stations || [],
            }));
          }
        } catch (error) {
          console.error("Failed to load building details:", error);
        }
      }
    };

    if (isOpen && formData.building_id) {
      loadBuildingDetails();
    }
  }, [isOpen, formData.building_id, buildings.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-dropdown]")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle dropdown helper
  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Helper to check if fields are readonly (not private_landlord and has building selected)
  const isFieldReadonly =
    formData.building_type !== "private_landlord" && !!formData.building_id;
  const occupationOptions = OCCUPATION_VALUES.map((value, i) => ({
    value,
    label: t(wizardKeys.step9.occupationOptions[i]),
  }));
  const familyStatusOptions = FAMILY_STATUS_VALUES.map((value, i) => ({
    value,
    label: t(wizardKeys.step9.familyStatusOptions[i]),
  }));
  const childrenOptions = CHILDREN_VALUES.map((value, i) => ({
    value,
    label: t(wizardKeys.step9.childrenStatusOptions[i]),
  }));
  const hasNoChildrenSelected = (formData.children || []).includes("no");

  // Metro Stations helpers
  const addMetroStation = () => {
    setFormData((prev) => ({
      ...prev,
      metro_stations: [
        ...prev.metro_stations,
        { label: "", destination: undefined },
      ],
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
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      metro_stations: prev.metro_stations.map((station, i) =>
        i === index ? { ...station, [field]: value } : station,
      ),
    }));
  };

  const toggleAmenity = (amenity: string) => {
    if (isFieldReadonly) return;
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const togglePropertyAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      property_amenities: (prev.property_amenities || []).includes(amenity)
        ? (prev.property_amenities || []).filter((a) => a !== amenity)
        : [...(prev.property_amenities || []), amenity],
    }));
  };

  // Pet helpers
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
            i === index ? { ...pet, [field]: value } : pet,
          )
        : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      return;
    }

    if (!property) return;

    // Validate building_id - required only if building_type is set and not "private_landlord"
    const isBuildingRequired =
      formData.building_type &&
      formData.building_type !== "private_landlord";

    if (isBuildingRequired && !formData.building_id) {
      setBuildingError("Please select a building");
      setBuildingTouched(true);
      // Scroll to building field
      const buildingField = document.querySelector("[data-building-field]");
      if (buildingField) {
        buildingField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    } else {
      setBuildingError(null);
    }

    setIsSubmitting(true);
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
        try {
          // Validate video file before upload
          const allowedVideoTypes = [
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-ms-wmv",
          ];

          if (!allowedVideoTypes.includes(videoFile.type)) {
            throw new Error(
              `Неподдерживаемый формат видео. Разрешены: MP4, MPEG, MOV, AVI, WMV. Ваш файл: ${videoFile.type || "неизвестный формат"}`,
            );
          }

          // Check file size (max 500MB)
          const maxSize = 500 * 1024 * 1024; // 500MB
          if (videoFile.size > maxSize) {
            const sizeMB = (videoFile.size / (1024 * 1024)).toFixed(2);
            throw new Error(
              `Файл слишком большой (${sizeMB} MB). Максимальный размер: 500 MB`,
            );
          }

          console.log("📹 Загрузка видео:", {
            name: videoFile.name,
            type: videoFile.type,
            size: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
          });

          const videoResult = await propertiesAPI.uploadVideo(videoFile);

          if (!videoResult || !videoResult.url) {
            throw new Error("Сервер не вернул URL загруженного видео");
          }

          uploadedVideo = videoResult.url;
          console.log("✅ Видео успешно загружено:", uploadedVideo);
        } catch (error: any) {
          console.error("❌ Ошибка загрузки видео:", error);
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Не удалось загрузить видео. Проверьте формат файла и размер.";
          throw new Error(`Ошибка загрузки видео: ${errorMessage}`);
        }
      }

      if (documentFile) {
        const docResult = await propertiesAPI.uploadDocuments(documentFile);
        uploadedDocuments = docResult.url;
      }

      // Combine existing (non-removed) photos with new uploads
      const existingPhotos = formData.photos.filter(
        (photo) => !removedPhotos.includes(photo),
      );
      const allPhotos = [...existingPhotos, ...uploadedPhotos];

      // Handle video - use new upload if exists, otherwise keep existing if not removed
      const finalVideo = uploadedVideo || (removedVideo ? "" : formData.video);

      // Handle documents - use new upload if exists, otherwise keep existing if not removed
      const finalDocuments =
        uploadedDocuments || (removedDocuments ? "" : formData.documents);

      // Normalize data before sending - ensure numbers are numbers, not strings
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
        return isNaN(num) || num <= 0 ? null : num;
      };

      // Build the property data object, ensuring all numeric fields are properly converted
      // Prepare property data - exclude operator_id for regular buildings (backend gets it from building)
      const { operator_id, building_id, ...formDataWithoutOperator } = formData;
      const propertyData: any = {
        title: formData.title?.trim() || "",
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
        let_duration:
          (formData.let_duration?.length ?? 0) > 0
            ? transformDurationUIToAPIArray(formData.let_duration || [])
            : null,
        bills: formData.bills || null,
        available_from: formData.available_from || null,
        // Boolean fields
        balcony: formData.balcony,
        terrace: formData.terrace,
        // Inherited fields (for private landlord)
        address: formData.address || null,
        tenant_types: [
          ...new Set(transformTenantTypeUIToAPI(formData.tenant_types || [])),
        ],
        amenities: formData.amenities || [],
        property_amenities: formData.property_amenities || [],
        family_status: formData.family_status || [],
        occupation: formData.occupation || [],
        children: formData.children || [],
        pet_policy: formData.pet_policy,
        pets: formData.pets || null,
        metro_stations: formData.metro_stations || [],
        commute_times: formData.commute_times || [],
        local_essentials: formData.local_essentials || [],
        // Media
        photos: allPhotos,
        video: finalVideo || null,
        documents: finalDocuments || null,
      };

      // Handle building_id based on building_type
      if (formData.building_type === "private_landlord") {
        // For private landlord, operator_id must be provided and building_id should be null
        if (!formData.operator_id) {
          throw new Error(
            "Please select an operator for private landlord properties",
          );
        }
        propertyData.operator_id = formData.operator_id;
        propertyData.building_id = null; // Explicitly set to null for private landlord
      } else if (formData.building_type) {
        // If building_type is set and not private_landlord, building_id must be provided
        if (!formData.building_id || formData.building_id === "") {
          throw new Error("Please select a building");
        }
        propertyData.building_id = formData.building_id;
      }
      // If building_type is empty/not set, don't include building_id at all

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPhotoFiles([]);
    setVideoFile(null);
    setDocumentFile(null);
    setRemovedPhotos([]);
    setRemovedVideo(false);
    setRemovedDocuments(false);
    setBuildingError(null);
    setBuildingTouched(false);
    onClose();
  };

  if (!isOpen || !property) return null;

  // Filter out removed photos
  const displayPhotos = formData.photos.filter(
    (photo) => !removedPhotos.includes(photo),
  );
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[8px] flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-black/50 backdrop-blur-[19px] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Edit Property</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditBasicInfoSection
              formData={formData}
              setFormData={setFormData}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              toggleDropdown={toggleDropdown}
              buildings={buildings}
              availableOperators={availableOperators}
              operatorsLoading={operatorsLoading}
              buildingError={buildingError}
              setBuildingError={setBuildingError}
              buildingTouched={buildingTouched}
              setBuildingTouched={setBuildingTouched}
              isFieldReadonly={isFieldReadonly}
              buildingTypeOptions={buildingTypeOptions}
              propertyTypeOptions={propertyTypeOptions}
            />

            <EditTenantTargetingSection
              formData={formData}
              setFormData={setFormData}
              openDropdown={openDropdown}
              toggleDropdown={toggleDropdown}
              isFieldReadonly={isFieldReadonly}
              tenantTypeOptions={tenantTypeOptions}
              occupationOptions={occupationOptions}
              familyStatusOptions={familyStatusOptions}
              childrenOptions={childrenOptions}
              hasNoChildrenSelected={hasNoChildrenSelected}
            />

            <EditPropertyDetailsSection
              formData={formData}
              setFormData={setFormData}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              toggleDropdown={toggleDropdown}
              furnishingOptions={furnishingOptions}
              durationOptions={durationOptions}
            />
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

          {/* Property Features - Amenities (multi-select dropdown, same as building) */}
          <EditAmenitiesSection
            formData={formData}
            setFormData={setFormData}
            openDropdown={openDropdown}
            toggleDropdown={toggleDropdown}
            isFieldReadonly={isFieldReadonly}
            toggleAmenity={toggleAmenity}
            togglePropertyAmenity={togglePropertyAmenity}
          />

          {/* Pets */}
          <EditPetPolicySection
            formData={formData}
            setFormData={setFormData}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            toggleDropdown={toggleDropdown}
            isFieldReadonly={isFieldReadonly}
            addPet={addPet}
            updatePet={updatePet}
            removePet={removePet}
          />

          {/* Metro Stations */}
          <EditMetroStationsSection
            formData={formData}
            addMetroStation={addMetroStation}
            updateMetroStation={updateMetroStation}
            removeMetroStation={removeMetroStation}
          />

          {/* Media Uploads */}
          <EditPropertyMediaSection
            formData={formData}
            setFormData={setFormData}
            displayPhotos={displayPhotos}
            removeExistingPhoto={removeExistingPhoto}
            removeNewPhoto={removeNewPhoto}
            handlePhotoChange={handlePhotoChange}
            photoFiles={photoFiles}
            setPhotoFiles={setPhotoFiles}
            photoPreviews={photoPreviews}
            setPhotoPreviews={setPhotoPreviews}
            videoPreview={videoPreview}
            setVideoFile={setVideoFile}
            documentFile={documentFile}
            setDocumentFile={setDocumentFile}
            removedVideo={removedVideo}
            setRemovedVideo={setRemovedVideo}
            removedDocuments={removedDocuments}
            setRemovedDocuments={setRemovedDocuments}
            photoInputRef={photoInputRef}
            videoInputRef={videoInputRef}
            documentInputRef={documentInputRef}
          />

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading || isSubmitting}
              className="px-6 py-2.5 text-white/90 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-medium border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="property-edit-submit"
              disabled={isLoading || isSubmitting}
              className="px-6 py-2.5 bg-white cursor-pointer text-black hover:bg-white/90 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;
