"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Save,
  Trash2,
  Upload,
  Plus,
  Minus,
  GripVertical,
} from "lucide-react";
import { propertiesAPI, buildingsAPI, usersAPI } from "../lib/api";
import {
  Property,
  PropertyType,
  BuildingType,
  Furnishing,
  LetDuration,
  Bills,
} from "../types/property";

interface Pet {
  type: "dog" | "cat" | "other";
  customType?: string;
  size?: "small" | "medium" | "large";
}

interface MetroStation {
  label: string;
  destination?: number;
}

interface CommuteTime {
  label: string;
  destination?: number;
}

interface LocalEssential {
  label: string;
  destination?: number;
}

interface ConciergeHours {
  from?: number;
  to?: number;
}

interface Building {
  id: string;
  name: string;
  address: string;
  operator_id: string;
  tenant_type?: string[];
  amenities?: string[];
  is_concierge?: boolean;
  concierge_hours?: ConciergeHours | null;
  pet_policy?: boolean;
  pets?: Pet[] | null;
  smoking_area?: boolean;
  metro_stations?: MetroStation[];
  commute_times?: CommuteTime[];
  local_essentials?: LocalEssential[];
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
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
    // Inherited fields
    address: "",
    tenant_types: [] as string[],
    amenities: [] as string[],
    pets: null as Pet[] | null,
    is_concierge: false,
    concierge_hours: null as ConciergeHours | null,
    pet_policy: false,
    smoking_area_prop: false,
    metro_stations: [] as MetroStation[],
    commute_times: [] as CommuteTime[],
    local_essentials: [] as LocalEssential[],
    operator_id: "",
  });

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );
  const [availableOperators, setAvailableOperators] = useState<User[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  // Validation errors state
  const [buildingError, setBuildingError] = useState<string | null>(null);
  const [buildingTouched, setBuildingTouched] = useState(false);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  // Drag and drop state for photos
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(
    null,
  );
  const [draggedPhotoFileIndex, setDraggedPhotoFileIndex] = useState<
    number | null
  >(null);

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

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
        luxury: property.luxury || false,
        furnishing: property.furnishing || "",
        let_duration: property.let_duration || "",
        floor: property.floor || null,
        outdoor_space: property.outdoor_space || false,
        balcony: property.balcony || false,
        terrace: property.terrace || false,
        square_meters: property.square_meters || null,
        photos: property.photos || [],
        video: videoValue,
        documents: property.documents || "",
        building_id: property.building_id || "",
        // Inherited fields - parse arrays properly
        address: property.address || "",
        tenant_types: parseArray(property.tenant_types),
        amenities: parseArray(property.amenities),
        pets: property.pets
          ? Array.isArray(property.pets)
            ? property.pets
            : []
          : null,
        is_concierge: property.is_concierge || false,
        concierge_hours: property.concierge_hours || null,
        pet_policy: property.pet_policy || false,
        smoking_area_prop: property.smoking_area || false,
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

  // Load buildings and operators when modal opens or building_type is private_landlord
  useEffect(() => {
    if (isOpen) {
      loadBuildings();
      // Load operators if building_type is already private_landlord
      if (formData.building_type === "private_landlord") {
        loadOperators();
      }
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

  const loadBuildings = async () => {
    try {
      const response = await buildingsAPI.getAll();
      const buildingsData = response.data?.data || response.data || [];
      setBuildings(buildingsData);
    } catch (error) {
      console.error("Failed to load buildings:", error);
    }
  };

  const loadOperators = async () => {
    try {
      console.log("🔄 Loading operators in EditPropertyModal...");
      console.log("🔍 Current formData.operator_id:", formData.operator_id);
      setOperatorsLoading(true);

      // Try to load operators with role filter first
      try {
        console.log("🔍 Trying usersAPI.getAll({ role: 'operator' })");
        const operatorsResponse = await usersAPI.getAll({ role: "operator" });
        console.log("🔍 Operators API response:", operatorsResponse);
        const operatorsData =
          operatorsResponse.data?.data || operatorsResponse.data || [];
        console.log(
          "✅ Operators loaded with role filter:",
          operatorsData.length,
          "operators",
        );

        if (operatorsData.length > 0) {
          let finalOperators = operatorsData;

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
      console.log("🔍 Falling back to usersAPI.getAll() without filter");
      const response = await usersAPI.getAll();
      console.log("🔍 All users API response:", response);
      const usersData =
        response.data?.users || response.data?.data || response.data || [];
      console.log("✅ All users loaded:", usersData.length, "users");
      console.log("🔍 Users data sample:", usersData.slice(0, 3));

      // Filter only operators
      const operatorsData = usersData.filter((user: User) => {
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

      let finalOperators = operatorsData;

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
        is_concierge: false,
        concierge_hours: null,
        pet_policy: false,
        pets: null,
        smoking_area_prop: false,
        metro_stations: [],
        commute_times: [],
        local_essentials: [],
      }));
      setSelectedBuilding(null);
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
        is_concierge: false,
        concierge_hours: null,
        pet_policy: false,
        pets: null,
        smoking_area_prop: false,
        metro_stations: [],
        commute_times: [],
        local_essentials: [],
      }));
      setSelectedBuilding(null);
      setBuildingError(null);
      setBuildingTouched(false);
    }
    setPrevBuildingType(formData.building_type);
  }, [formData.building_type]);

  // Update selectedBuilding when building_id changes
  useEffect(() => {
    if (formData.building_id && formData.building_type !== "private_landlord") {
      const building = buildings.find((b) => b.id === formData.building_id);
      if (building) {
        setSelectedBuilding(building);
      }
    } else {
      setSelectedBuilding(null);
    }
  }, [formData.building_id, formData.building_type, buildings]);

  // Load building details and populate inherited fields when a building is selected
  useEffect(() => {
    const loadBuildingDetails = async () => {
      if (
        formData.building_id &&
        formData.building_type !== "private_landlord" &&
        buildings.length > 0
      ) {
        try {
          const response = await buildingsAPI.getById(formData.building_id);
          const building = response.data;
          if (building) {
            // Always populate from building when building is selected (for linked properties)
            setFormData((prev) => ({
              ...prev,
              address: building.address || "",
              tenant_types: building.tenant_type || [],
              amenities: building.amenities || [],
              is_concierge: building.is_concierge || false,
              concierge_hours: building.concierge_hours || null,
              pet_policy: building.pet_policy || false,
              pets: building.pets || null,
              smoking_area_prop: building.smoking_area || false,
              metro_stations: building.metro_stations || [],
              commute_times: building.commute_times || [],
              local_essentials: building.local_essentials || [],
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

  // Helper to check if fields are readonly (not private_landlord and has building selected)
  const isFieldReadonly =
    formData.building_type !== "private_landlord" && !!formData.building_id;

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

  // Commute Times helpers
  const addCommuteTime = () => {
    setFormData((prev) => ({
      ...prev,
      commute_times: [
        ...prev.commute_times,
        { label: "", destination: undefined },
      ],
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
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      commute_times: prev.commute_times.map((time, i) =>
        i === index ? { ...time, [field]: value } : time,
      ),
    }));
  };

  // Local Essentials helpers
  const addLocalEssential = () => {
    setFormData((prev) => ({
      ...prev,
      local_essentials: [
        ...prev.local_essentials,
        { label: "", destination: undefined },
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
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      local_essentials: prev.local_essentials.map((essential, i) =>
        i === index ? { ...essential, [field]: value } : essential,
      ),
    }));
  };

  // Available amenities list
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
    "Maintenance",
    "Events calendar",
    "Pet areas",
    "Kids' room",
    "Garden",
  ];

  const toggleAmenity = (amenity: string) => {
    if (isFieldReadonly) return;
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
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
      formData.building_type !== "" &&
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
        let_duration: formData.let_duration || null,
        bills: formData.bills || null,
        available_from: formData.available_from || null,
        // Boolean fields
        outdoor_space: formData.outdoor_space,
        balcony: formData.balcony,
        terrace: formData.terrace,
        luxury: formData.luxury,
        // Inherited fields (for private landlord)
        address: formData.address || null,
        tenant_types: formData.tenant_types || [],
        amenities: formData.amenities || [],
        is_concierge: formData.is_concierge,
        concierge_hours: formData.concierge_hours || null,
        pet_policy: formData.pet_policy,
        pets: formData.pets || null,
        smoking_area: formData.smoking_area_prop,
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
      } else if (formData.building_type && formData.building_type !== "") {
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
            <div className="md:col-span-2">
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
                placeholder="Enter property title"
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

            {formData.building_type !== "private_landlord" ? (
              <div data-building-field>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Building *
                </label>
                <div className="relative" data-dropdown>
                  <div
                    className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between ${
                      buildingError && buildingTouched
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-white/20"
                    }`}
                    onClick={() => {
                      toggleDropdown("building");
                      setBuildingTouched(true);
                    }}
                  >
                    <span
                      className={
                        formData.building_id ? "text-white" : "text-white/50"
                      }
                    >
                      {formData.building_id
                        ? buildings.find((b) => b.id === formData.building_id)
                            ?.name +
                          " - " +
                          buildings.find((b) => b.id === formData.building_id)
                            ?.address
                        : "Select Building"}
                    </span>
                    <svg
                      className="w-5 h-5 text-white/70"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {openDropdown === "building" && (
                    <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {buildings.map((building) => (
                        <div
                          key={building.id}
                          className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center ${
                            formData.building_id === building.id
                              ? "bg-white/10"
                              : ""
                          }`}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              building_id: building.id,
                            });
                            setBuildingError(null);
                            setOpenDropdown(null);
                          }}
                        >
                          {building.name} - {building.address}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {buildingError && buildingTouched && (
                  <p className="mt-1 text-sm text-red-500">{buildingError}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Operator *
                </label>
                <div className="relative" data-dropdown>
                  <div
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                    onClick={() => toggleDropdown("operator")}
                  >
                    <span
                      className={
                        formData.operator_id ? "text-white" : "text-white/50"
                      }
                    >
                      {operatorsLoading
                        ? "Loading operators..."
                        : formData.operator_id
                          ? availableOperators.find(
                              (o) => o.id === formData.operator_id,
                            )?.full_name ||
                            availableOperators.find(
                              (o) => o.id === formData.operator_id,
                            )?.email
                          : "Select Operator"}
                    </span>
                    <svg
                      className="w-5 h-5 text-white/70"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {openDropdown === "operator" && !operatorsLoading && (
                    <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableOperators.map((operator) => (
                        <div
                          key={operator.id}
                          className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center ${
                            formData.operator_id === operator.id
                              ? "bg-white/10"
                              : ""
                          }`}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              operator_id: operator.id,
                            });
                            setOpenDropdown(null);
                          }}
                        >
                          {operator.full_name || operator.email}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Building Type
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("building_type")}
                >
                  <span
                    className={
                      formData.building_type ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.building_type
                      ? formData.building_type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Select Type"}
                  </span>
                  <svg
                    className="w-5 h-5 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {openDropdown === "building_type" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.values(BuildingType)
                      .filter((type) => type !== "luxury")
                      .map((type) => (
                        <div
                          key={type}
                          className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                            formData.building_type === type ? "bg-white/10" : ""
                          }`}
                          onClick={() => {
                            setFormData({ ...formData, building_type: type });
                            setOpenDropdown(null);
                          }}
                        >
                          {type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      ))}
                  </div>
                )}
              </div>
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
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("property_type")}
                >
                  <span
                    className={
                      formData.property_type ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.property_type
                      ? formData.property_type.charAt(0).toUpperCase() +
                        formData.property_type.slice(1)
                      : "Select Type"}
                  </span>
                  <svg
                    className="w-5 h-5 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {openDropdown === "property_type" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.values(PropertyType).map((type) => (
                      <div
                        key={type}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          formData.property_type === type ? "bg-white/10" : ""
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, property_type: type });
                          setOpenDropdown(null);
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Address field - readonly if linked to building */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Address{" "}
                {isFieldReadonly && (
                  <span className="text-white/50 text-xs">(from building)</span>
                )}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                readOnly={isFieldReadonly}
                className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 ${
                  isFieldReadonly ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>

            {/* Tenant Type multi-select dropdown */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Tenant Types{" "}
                {isFieldReadonly && (
                  <span className="text-white/50 text-xs">(from building)</span>
                )}
              </label>
              <div className="relative" data-dropdown>
                <div
                  className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white min-h-[40px] flex items-center ${
                    isFieldReadonly
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() =>
                    !isFieldReadonly && toggleDropdown("tenant_types")
                  }
                >
                  <div className="flex flex-wrap gap-1 flex-1">
                    {formData.tenant_types.length > 0 ? (
                      formData.tenant_types.map((value) => {
                        const option = [
                          { value: "corporateLets", label: "Corporate Lets" },
                          { value: "sharers", label: "Sharers" },
                          { value: "student", label: "Student" },
                          { value: "family", label: "Family" },
                          { value: "elder", label: "Elder" },
                        ].find((opt) => opt.value === value);
                        return (
                          <span
                            key={value}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                          >
                            {option?.label || value}
                            {!isFieldReadonly && (
                              <button
                                type="button"
                                className="ml-1 text-white/70 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    tenant_types: formData.tenant_types.filter(
                                      (t) => t !== value,
                                    ),
                                  });
                                }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-white/50">Select types...</span>
                    )}
                  </div>
                  {!isFieldReadonly && (
                    <svg
                      className="w-5 h-5 text-white/70 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
                {!isFieldReadonly && openDropdown === "tenant_types" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {[
                      { value: "corporateLets", label: "Corporate Lets" },
                      { value: "sharers", label: "Sharers" },
                      { value: "student", label: "Student" },
                      { value: "family", label: "Family" },
                      { value: "elder", label: "Elder" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                        onClick={() => {
                          const newTenantTypes = formData.tenant_types.includes(
                            option.value,
                          )
                            ? formData.tenant_types.filter(
                                (t) => t !== option.value,
                              )
                            : [...formData.tenant_types, option.value];
                          setFormData({
                            ...formData,
                            tenant_types: newTenantTypes,
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.tenant_types.includes(option.value)}
                          readOnly
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{option.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Furnishing
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("furnishing")}
                >
                  <span
                    className={
                      formData.furnishing ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.furnishing
                      ? formData.furnishing
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Select Type"}
                  </span>
                  <svg
                    className="w-5 h-5 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {openDropdown === "furnishing" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.values(Furnishing).map((type) => (
                      <div
                        key={type}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          formData.furnishing === type ? "bg-white/10" : ""
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, furnishing: type });
                          setOpenDropdown(null);
                        }}
                      >
                        {type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Let Duration
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("let_duration")}
                >
                  <span
                    className={
                      formData.let_duration ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.let_duration
                      ? formData.let_duration
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Select Duration"}
                  </span>
                  <svg
                    className="w-5 h-5 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {openDropdown === "let_duration" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.values(LetDuration).map((type) => (
                      <div
                        key={type}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          formData.let_duration === type ? "bg-white/10" : ""
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, let_duration: type });
                          setOpenDropdown(null);
                        }}
                      >
                        {type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bills
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("bills")}
                >
                  <span
                    className={formData.bills ? "text-white" : "text-white/50"}
                  >
                    {formData.bills
                      ? formData.bills.charAt(0).toUpperCase() +
                        formData.bills.slice(1)
                      : "Select Option"}
                  </span>
                  <svg
                    className="w-5 h-5 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {openDropdown === "bills" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.values(Bills).map((type) => (
                      <div
                        key={type}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          formData.bills === type ? "bg-white/10" : ""
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, bills: type });
                          setOpenDropdown(null);
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bedrooms
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("bedrooms")}
                >
                  <span
                    className={
                      formData.bedrooms ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.bedrooms
                      ? formData.bedrooms >= 5
                        ? "5+"
                        : formData.bedrooms
                      : "Select Bedrooms"}
                  </span>
                  <svg
                    className="w-5 h-5 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {openDropdown === "bedrooms" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <div
                        key={value}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          (value === 5 &&
                            formData.bedrooms &&
                            formData.bedrooms >= 5) ||
                          (value < 5 && formData.bedrooms === value)
                            ? "bg-white/10"
                            : ""
                        }`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            bedrooms: value,
                          });
                          setOpenDropdown(null);
                        }}
                      >
                        {value === 5 ? "5+" : value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bathrooms
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("bathrooms")}
                >
                  <span
                    className={
                      formData.bathrooms ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.bathrooms
                      ? formData.bathrooms >= 4
                        ? "4+"
                        : formData.bathrooms
                      : "Select Bathrooms"}
                  </span>
                  <svg
                    className="w-5 h-5 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {openDropdown === "bathrooms" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {[1, 2, 3, 4].map((value) => (
                      <div
                        key={value}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          (value === 4 &&
                            formData.bathrooms &&
                            formData.bathrooms >= 4) ||
                          (value < 4 && formData.bathrooms === value)
                            ? "bg-white/10"
                            : ""
                        }`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            bathrooms: value,
                          });
                          setOpenDropdown(null);
                        }}
                      >
                        {value === 4 ? "4+" : value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.luxury}
                onChange={(e) =>
                  setFormData({ ...formData, luxury: e.target.checked })
                }
                className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
              />
              <span className="text-sm text-white/90">Luxury</span>
            </label>
          </div>

          {/* Property Features */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Amenities{" "}
              {isFieldReadonly && (
                <span className="text-white/50 text-xs">(from building)</span>
              )}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`edit-amenity-${amenity}`}
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    disabled={isFieldReadonly}
                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${
                      isFieldReadonly ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                  <label
                    htmlFor={`edit-amenity-${amenity}`}
                    className={`text-sm font-medium text-white/90 ${
                      isFieldReadonly ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>

            {/* Concierge */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
                Concierge{" "}
                {isFieldReadonly && (
                  <span className="text-white/50 text-xs">(from building)</span>
                )}
              </h4>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_concierge_property_edit"
                  checked={formData.is_concierge}
                  onChange={(e) =>
                    setFormData({ ...formData, is_concierge: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="is_concierge_property_edit"
                  className="text-sm font-medium text-white/90"
                >
                  Has Concierge Service
                </label>
              </div>

              {formData.is_concierge && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Opening Hour (0-23)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={formData.concierge_hours?.from ?? ""}
                      onChange={(e) => {
                        const inputVal = e.target.value;
                        if (inputVal === "") {
                          setFormData({
                            ...formData,
                            concierge_hours: {
                              from: undefined,
                              to: formData.concierge_hours?.to,
                            },
                          });
                        } else {
                          const val = Math.max(
                            0,
                            Math.min(23, parseInt(inputVal) || 0),
                          );
                          setFormData({
                            ...formData,
                            concierge_hours: {
                              from: val,
                              to: formData.concierge_hours?.to,
                            },
                          });
                        }
                      }}
                      className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Closing Hour (0-23)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={formData.concierge_hours?.to ?? ""}
                      onChange={(e) => {
                        const inputVal = e.target.value;
                        if (inputVal === "") {
                          setFormData({
                            ...formData,
                            concierge_hours: {
                              from: formData.concierge_hours?.from,
                              to: undefined,
                            },
                          });
                        } else {
                          const val = Math.max(
                            0,
                            Math.min(23, parseInt(inputVal) || 0),
                          );
                          setFormData({
                            ...formData,
                            concierge_hours: {
                              from: formData.concierge_hours?.from,
                              to: val,
                            },
                          });
                        }
                      }}
                      className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pets */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
                Pet Policy{" "}
                {isFieldReadonly && (
                  <span className="text-white/50 text-xs">(from building)</span>
                )}
              </h4>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pet_policy_property_edit"
                  checked={formData.pet_policy}
                  onChange={(e) =>
                    !isFieldReadonly &&
                    setFormData({ ...formData, pet_policy: e.target.checked })
                  }
                  disabled={isFieldReadonly}
                  className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${
                    isFieldReadonly ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
                <label
                  htmlFor="pet_policy_property_edit"
                  className="text-sm font-medium text-white/90"
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
                        <h5 className="font-medium text-white">
                          Pet {index + 1}
                        </h5>
                        {!isFieldReadonly && (
                          <button
                            type="button"
                            onClick={() => removePet(index)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/90 mb-2">
                            Type
                          </label>
                          <div className="relative" data-dropdown>
                            <div
                              className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white min-h-[40px] flex items-center justify-between ${
                                isFieldReadonly
                                  ? "opacity-60 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                              onClick={() =>
                                !isFieldReadonly &&
                                toggleDropdown(`pet_type_${index}`)
                              }
                            >
                              <span className="capitalize">{pet.type}</span>
                              {!isFieldReadonly && (
                                <svg
                                  className="w-5 h-5 text-white/70"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )}
                            </div>
                            {!isFieldReadonly &&
                              openDropdown === `pet_type_${index}` && (
                                <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {["dog", "cat", "other"].map((type) => (
                                    <div
                                      key={type}
                                      className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white capitalize ${
                                        pet.type === type ? "bg-white/10" : ""
                                      }`}
                                      onClick={() => {
                                        updatePet(index, "type", type);
                                        setOpenDropdown(null);
                                      }}
                                    >
                                      {type}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>

                        {pet.type === "other" && (
                          <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                              Custom Type
                            </label>
                            <input
                              type="text"
                              value={pet.customType || ""}
                              onChange={(e) =>
                                !isFieldReadonly &&
                                updatePet(index, "customType", e.target.value)
                              }
                              readOnly={isFieldReadonly}
                              className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 ${
                                isFieldReadonly
                                  ? "opacity-60 cursor-not-allowed"
                                  : ""
                              }`}
                              placeholder="e.g., Hamster"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-white/90 mb-2">
                            Size (Optional)
                          </label>
                          <div className="relative" data-dropdown>
                            <div
                              className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white min-h-[40px] flex items-center justify-between ${
                                isFieldReadonly
                                  ? "opacity-60 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                              onClick={() =>
                                !isFieldReadonly &&
                                toggleDropdown(`pet_size_${index}`)
                              }
                            >
                              <span
                                className={
                                  pet.size ? "capitalize" : "text-white/50"
                                }
                              >
                                {pet.size ? pet.size : "Not specified"}
                              </span>
                              {!isFieldReadonly && (
                                <svg
                                  className="w-5 h-5 text-white/70"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )}
                            </div>
                            {!isFieldReadonly &&
                              openDropdown === `pet_size_${index}` && (
                                <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {[
                                    { value: "", label: "Not specified" },
                                    { value: "small", label: "Small" },
                                    { value: "medium", label: "Medium" },
                                    { value: "large", label: "Large" },
                                  ].map((size) => (
                                    <div
                                      key={size.value}
                                      className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                                        (pet.size || "") === size.value
                                          ? "bg-white/10"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        updatePet(
                                          index,
                                          "size",
                                          size.value || undefined,
                                        );
                                        setOpenDropdown(null);
                                      }}
                                    >
                                      {size.label}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!isFieldReadonly && (
                    <button
                      type="button"
                      onClick={addPet}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-200"
                    >
                      Add Pet Type
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Smoking Area */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
                Other{" "}
                {isFieldReadonly && (
                  <span className="text-white/50 text-xs">(from building)</span>
                )}
              </h4>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smoking_area_property_edit"
                  checked={formData.smoking_area_prop}
                  onChange={(e) =>
                    !isFieldReadonly &&
                    setFormData({
                      ...formData,
                      smoking_area_prop: e.target.checked,
                    })
                  }
                  disabled={isFieldReadonly}
                  className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${
                    isFieldReadonly ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
                <label
                  htmlFor="smoking_area_property_edit"
                  className="text-sm font-medium text-white/90"
                >
                  Has Smoking Area
                </label>
              </div>
            </div>

            {/* Metro Stations */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
                Metro Stations
              </h4>

              {formData.metro_stations.map((station, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={station.label}
                    onChange={(e) =>
                      updateMetroStation(index, "label", e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                    placeholder="Station name"
                  />
                  <input
                    type="number"
                    value={station.destination ?? ""}
                    onChange={(e) => {
                      const inputVal = e.target.value;
                      if (inputVal === "") {
                        updateMetroStation(index, "destination", undefined);
                      } else {
                        const val = Math.max(0, parseInt(inputVal) || 0);
                        updateMetroStation(index, "destination", val);
                      }
                    }}
                    className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    placeholder="min"
                    min="0"
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
              >
                Add Metro Station
              </button>
            </div>

            {/* Commute Times */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
                Commute Times
              </h4>

              {formData.commute_times.map((time, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={time.label}
                    onChange={(e) =>
                      updateCommuteTime(index, "label", e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                    placeholder="Destination"
                  />
                  <input
                    type="number"
                    value={time.destination ?? ""}
                    onChange={(e) => {
                      const inputVal = e.target.value;
                      if (inputVal === "") {
                        updateCommuteTime(index, "destination", undefined);
                      } else {
                        const val = Math.max(0, parseInt(inputVal) || 0);
                        updateCommuteTime(index, "destination", val);
                      }
                    }}
                    className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    placeholder="min"
                    min="0"
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
              >
                Add Commute Time
              </button>
            </div>

            {/* Local Essentials */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
                Local Essentials
              </h4>

              {formData.local_essentials.map((essential, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={essential.label}
                    onChange={(e) =>
                      updateLocalEssential(index, "label", e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                    placeholder="Essential name"
                  />
                  <input
                    type="number"
                    value={essential.destination ?? ""}
                    onChange={(e) => {
                      const inputVal = e.target.value;
                      if (inputVal === "") {
                        updateLocalEssential(index, "destination", undefined);
                      } else {
                        const val = Math.max(0, parseInt(inputVal) || 0);
                        updateLocalEssential(index, "destination", val);
                      }
                    }}
                    className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    placeholder="min"
                    min="0"
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
              >
                Add Local Essential
              </button>
            </div>
          </div>

          {/* Media Uploads */}
          <div className="space-y-4">
            {/* Existing Photos */}
            {displayPhotos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-white/90">
                    Current Photos ({displayPhotos.length})
                  </label>
                  <span className="text-xs text-white/60">Drag to reorder</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {displayPhotos.map((photo, index) => (
                    <div
                      key={`existing-photo-${photo}-${index}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedPhotoIndex(index);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (
                          draggedPhotoIndex === null ||
                          draggedPhotoIndex === index
                        ) {
                          setDraggedPhotoIndex(null);
                          return;
                        }

                        const newPhotos = [...displayPhotos];
                        const [draggedPhoto] = newPhotos.splice(
                          draggedPhotoIndex,
                          1,
                        );
                        newPhotos.splice(index, 0, draggedPhoto);

                        // Update formData with new order
                        setFormData((prev) => ({
                          ...prev,
                          photos: newPhotos,
                        }));

                        setDraggedPhotoIndex(null);
                      }}
                      className={`relative group cursor-move transition-all ${
                        draggedPhotoIndex === index ? "opacity-50 scale-95" : ""
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Current ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="absolute bottom-1 left-1">
                          <div className="p-0.5 bg-white/20 rounded-full">
                            <GripVertical className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(photo)}
                          className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
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
                    <div
                      key={`new-photo-${index}-${photoFiles[index]?.name}-${photoFiles[index]?.size}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedPhotoFileIndex(index);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (
                          draggedPhotoFileIndex === null ||
                          draggedPhotoFileIndex === index
                        ) {
                          setDraggedPhotoFileIndex(null);
                          return;
                        }

                        const newFiles = [...photoFiles];
                        const [draggedFile] = newFiles.splice(
                          draggedPhotoFileIndex,
                          1,
                        );
                        newFiles.splice(index, 0, draggedFile);

                        // Update both photoFiles and photoPreviews to maintain order
                        setPhotoFiles(newFiles);

                        // Update previews order
                        const newPreviews = [...photoPreviews];
                        const [draggedPreview] = newPreviews.splice(
                          draggedPhotoFileIndex,
                          1,
                        );
                        newPreviews.splice(index, 0, draggedPreview);
                        setPhotoPreviews(newPreviews);

                        setDraggedPhotoFileIndex(null);
                      }}
                      className={`relative group cursor-move transition-all ${
                        draggedPhotoFileIndex === index
                          ? "opacity-50 scale-95"
                          : ""
                      }`}
                    >
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-green-500"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="absolute bottom-1 left-1">
                          <div className="p-0.5 bg-white/20 rounded-full">
                            <GripVertical className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
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
                      onError={(e) => {
                        console.error("❌ Ошибка загрузки видео:", {
                          src: formData.video,
                          error: e,
                        });
                      }}
                      onLoadedData={() => {
                        console.log(
                          "✅ Видео успешно загружено:",
                          formData.video,
                        );
                      }}
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
                  <p className="text-xs text-white/60 mt-1">MP4, AVI</p>
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
              disabled={isLoading || isSubmitting}
              className="px-6 py-2.5 text-white/90 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-medium border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
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
