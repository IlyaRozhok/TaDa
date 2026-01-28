"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Upload, Trash2, Plus, Minus } from "lucide-react";
import { propertiesAPI, buildingsAPI, usersAPI } from "../lib/api";
import {
  PropertyType,
  BuildingType,
  Furnishing,
  LetDuration,
  Bills,
} from "../types/property";
import { FormField, Input, Select, Textarea } from "./FormField";
import { useFormValidation, ValidationRules, commonRules } from "../hooks/useFormValidation";

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

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  operators?: User[];
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  operators = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules for property form
  const validationRules: ValidationRules = {
    title: {
      required: true,
      minLength: 3,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-'.,()]+$/
    },
    apartment_number: {
      maxLength: 20,
      pattern: /^[a-zA-Z0-9\-\/]+$/
    },
    description: {
      maxLength: 1000
    },
    price: {
      required: true,
      min: 1,
      max: 50000,
      custom: (value: number) => {
        if (value && value % 1 !== 0 && value.toString().split('.')[1]?.length > 2) {
          return 'Price can have maximum 2 decimal places';
        }
        return null;
      }
    },
    deposit: {
      min: 0,
      max: 100000,
      custom: (value: number) => {
        if (value && value % 1 !== 0 && value.toString().split('.')[1]?.length > 2) {
          return 'Deposit can have maximum 2 decimal places';
        }
        return null;
      }
    },
    available_from: {
      required: true,
      custom: (value: string) => {
        if (value && new Date(value) < new Date()) {
          return 'Available date cannot be in the past';
        }
        return null;
      }
    },
    bills: { required: true },
    property_type: { required: true },
    bedrooms: {
      required: true,
      min: 0,
      max: 20
    },
    bathrooms: {
      required: true,
      min: 1,
      max: 20
    },
    building_type: { required: true },
    furnishing: { required: true },
    let_duration: { required: true },
    floor: {
      min: -5,
      max: 200
    },
    square_meters: {
      min: 1,
      max: 10000,
      custom: (value: number) => {
        if (value && value % 1 !== 0 && value.toString().split('.')[1]?.length > 2) {
          return 'Square meters can have maximum 2 decimal places';
        }
        return null;
      }
    },
    address: {
      required: true,
      minLength: 5,
      maxLength: 200
    },
    building_id: {
      custom: (value: string, formData?: any) => {
        if (formData?.building_type !== 'private_landlord' && !value) {
          return 'Please select a building';
        }
        return null;
      }
    },
    operator_id: {
      custom: (value: string, formData?: any) => {
        if (formData?.building_type === 'private_landlord' && !value) {
          return 'Please select an operator';
        }
        return null;
      }
    }
  };

  const { errors, touched, validateAll, validate, setFieldTouched, clearErrors } = useFormValidation(validationRules);

  // Handle field changes with validation
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validate(field, value);
    }
  };

  const handleFieldBlur = (field: string) => {
    setFieldTouched(field, true);
    validate(field, formData[field as keyof typeof formData]);
  };
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
    operator_id: "",
    // Inherited fields
    address: "",
    tenant_types: [] as string[],
    amenities: [] as string[],
    pets: null as Pet[] | null,
    is_concierge: false,
    concierge_hours: null as ConciergeHours | null,
    pet_policy: false,
    smoking_area: false,
    metro_stations: [] as MetroStation[],
    commute_times: [] as CommuteTime[],
    local_essentials: [] as LocalEssential[],
  });

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null
  );
  const [availableOperators, setAvailableOperators] = useState<User[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [operatorsLoaded, setOperatorsLoaded] = useState(false);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  // Load buildings and use operators from props
  useEffect(() => {
    if (isOpen) {
      loadBuildings();
    }
  }, [isOpen]);

  // Load operators when building_type changes to private_landlord
  useEffect(() => {
    if (formData.building_type === "private_landlord" && isOpen && !operatorsLoading && !operatorsLoaded) {
      loadOperators();
    }
  }, [formData.building_type, isOpen]);

  // Use operators from props or load them if not available
  useEffect(() => {
    console.log("🔄 AddPropertyModal operators prop changed:", operators);
    if (operators && operators.length > 0) {
      console.log(
        "✅ Setting availableOperators from props:",
        operators.length,
        "operators"
      );
      setAvailableOperators(operators);
      setOperatorsLoaded(true);
    } else if (isOpen && !operatorsLoading && !operatorsLoaded) {
      console.log("⚠️ No operators in props, trying to load them...");
      // Only load operators once when modal opens and not already loading/loaded
      loadOperators();
    }
  }, [operators, isOpen]);

  const loadBuildings = async () => {
    try {
      const response = await buildingsAPI.getAll();
      const buildingsData = response.data?.data || response.data || [];
      setBuildings(buildingsData);
    } catch (error) {
      console.error("Failed to load buildings:", error);
    }
  };

  // Track previous building_type to detect changes
  const [prevBuildingType, setPrevBuildingType] = useState<string | null>(null);

  // When building_type changes, clear inherited fields and building_id/operator_id
  useEffect(() => {
    if (
      prevBuildingType !== null &&
      prevBuildingType !== formData.building_type
    ) {
      // Building type changed - clear inherited fields and selection
      setFormData((prev) => ({
        ...prev,
        building_id: "",
        operator_id: "",
        address: "",
        tenant_types: [],
        amenities: [],
        is_concierge: false,
        concierge_hours: null,
        pet_policy: false,
        pets: null,
        smoking_area: false,
        metro_stations: [],
        commute_times: [],
        local_essentials: [],
      }));
      setSelectedBuilding(null);
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
        formData.building_type !== "private_landlord"
      ) {
        try {
          const response = await buildingsAPI.getById(formData.building_id);
          const building = response.data;
          if (building) {
            // Always populate from building when building is selected
            setFormData((prev) => ({
              ...prev,
              address: building.address || "",
              tenant_types: building.tenant_type || [],
              amenities: building.amenities || [],
              is_concierge: building.is_concierge || false,
              concierge_hours: building.concierge_hours || null,
              pet_policy: building.pet_policy || false,
              pets: building.pets || null,
              smoking_area: building.smoking_area || false,
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
  }, [isOpen, formData.building_id]);

  const loadOperators = async () => {
    if (operatorsLoading) {
      console.log("🔄 Operators already loading, skipping...");
      return;
    }

    try {
      console.log("🔄 Loading operators in AddPropertyModal...");
      setOperatorsLoading(true);

      // Try to load operators with role filter first
      const response = await usersAPI.getAll({ role: "operator" });
      const usersData =
        response.data?.users || response.data?.data || response.data || [];
      console.log("✅ Users loaded:", usersData.length, "users");

      // Filter only operators
      const operatorsData = usersData.filter(
        (user: User) => user.role === "operator" || user.role === "Operator"
      );
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

      setAvailableOperators(finalOperators);
      setOperatorsLoaded(true);
    } catch (error: any) {
      console.error("❌ Failed to load operators:", error);

      // If authentication error, show message but don't clear operators
      if (error.response?.status === 401) {
        console.log("🔐 Authentication required to load operators");
        addNotification?.("warning", "Please log in to load operators list");
      }

      setAvailableOperators([]);
    } finally {
      setOperatorsLoading(false);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is inside any dropdown trigger or menu
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
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      metro_stations: prev.metro_stations.map((station, i) =>
        i === index ? { ...station, [field]: value } : station
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
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      commute_times: prev.commute_times.map((time, i) =>
        i === index ? { ...time, [field]: value } : time
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
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      local_essentials: prev.local_essentials.map((essential, i) =>
        i === index ? { ...essential, [field]: value } : essential
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
            i === index ? { ...pet, [field]: value } : pet
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

    // Validate all fields
    const isValid = validateAll(formData);
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
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

      // Prepare property data - exclude operator_id for regular buildings (backend gets it from building)
      const { operator_id, ...formDataWithoutOperator } = formData;
      const propertyData: any = {
        ...formDataWithoutOperator,
        photos: uploadedPhotos,
        video: uploadedVideo,
        documents: uploadedDocuments,
      };

      // For private landlord, operator_id must be provided
      if (formData.building_type === "private_landlord") {
        if (!formData.operator_id) {
          throw new Error(
            "Please select an operator for private landlord properties"
          );
        }
        propertyData.operator_id = formData.operator_id;
        propertyData.building_id = null; // Explicitly set to null for private landlord
      }

      // Include inherited fields
      propertyData.metro_stations = formData.metro_stations;
      propertyData.commute_times = formData.commute_times;
      propertyData.local_essentials = formData.local_essentials;
      propertyData.concierge_hours = formData.concierge_hours;
      propertyData.pets = formData.pets;

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
    } finally {
      setIsSubmitting(false);
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
      // Inherited fields
      address: "",
      tenant_types: [] as string[],
      amenities: [] as string[],
      pets: null as Pet[] | null,
      is_concierge: false,
      concierge_hours: null as ConciergeHours | null,
      pet_policy: false,
      smoking_area: false,
      metro_stations: [] as MetroStation[],
      commute_times: [] as CommuteTime[],
      local_essentials: [] as LocalEssential[],
      operator_id: "",
    });

    // Reset operators state
    setOperatorsLoaded(false);
    setOperatorsLoading(false);
    if (!operators || operators.length === 0) {
      setAvailableOperators([]);
    }
    setPhotoFiles([]);
    setVideoFile(null);
    setDocumentFile(null);
    setSelectedBuilding(null);
    clearErrors();
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
            <FormField
              label="Title"
              required
              error={errors.title}
              touched={touched.title}
              helpText="Enter a descriptive title for the property"
            >
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                onBlur={() => handleFieldBlur('title')}
                error={touched.title && !!errors.title}
                placeholder="e.g. Modern 2BR Apartment"
              />
            </FormField>

            <FormField
              label="Apartment Number"
              error={errors.apartment_number}
              touched={touched.apartment_number}
              helpText="Optional apartment/unit number"
            >
              <Input
                type="text"
                value={formData.apartment_number}
                onChange={(e) => handleFieldChange('apartment_number', e.target.value)}
                onBlur={() => handleFieldBlur('apartment_number')}
                error={touched.apartment_number && !!errors.apartment_number}
                placeholder="e.g. 2A, 15B"
              />
            </FormField>

            {formData.building_type === "private_landlord" ? (
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
                      {formData.operator_id
                        ? availableOperators.find(
                            (o) => o.id === formData.operator_id
                          )?.full_name ||
                          availableOperators.find(
                            (o) => o.id === formData.operator_id
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
                  {openDropdown === "operator" && (
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
            ) : formData.building_type ? (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Building *
                </label>
                <div className="relative" data-dropdown>
                  <div
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                    onClick={() => toggleDropdown("building")}
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
                            setOpenDropdown(null);
                          }}
                        >
                          {building.name} - {building.address}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

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
                                      (t) => t !== value
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
                            option.value
                          )
                            ? formData.tenant_types.filter(
                                (t) => t !== option.value
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

            <FormField
              label="Price (£ PCM)"
              required
              error={errors.price}
              touched={touched.price}
              helpText="Monthly rent in British Pounds"
            >
              <Input
                type="number"
                value={formData.price || ""}
                onChange={(e) => handleFieldChange('price', e.target.value === "" ? null : Number(e.target.value))}
                onBlur={() => handleFieldBlur('price')}
                error={touched.price && !!errors.price}
                min="0"
                step="0.01"
                placeholder="e.g. 1500"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </FormField>

            <FormField
              label="Deposit (£)"
              error={errors.deposit}
              touched={touched.deposit}
              helpText="Security deposit amount (optional)"
            >
              <Input
                type="number"
                value={formData.deposit || ""}
                onChange={(e) => handleFieldChange('deposit', e.target.value === "" ? null : Number(e.target.value))}
                onBlur={() => handleFieldBlur('deposit')}
                error={touched.deposit && !!errors.deposit}
                min="0"
                step="0.01"
                placeholder="e.g. 1500"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </FormField>

            <FormField
              label="Available From"
              required
              error={errors.available_from}
              touched={touched.available_from}
              helpText="When the property becomes available"
            >
              <Input
                type="date"
                value={formData.available_from}
                onChange={(e) => handleFieldChange('available_from', e.target.value)}
                onBlur={() => handleFieldBlur('available_from')}
                error={touched.available_from && !!errors.available_from}
              />
            </FormField>

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.luxury}
                onChange={(e) =>
                  setFormData({ ...formData, luxury: e.target.checked })
                }
                className="w-4 h-4 text-white border-white/30 rounded focus:ring-white/50 bg-white/10"
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
                    id={`amenity-${amenity}`}
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    disabled={isFieldReadonly}
                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${
                      isFieldReadonly ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                  <label
                    htmlFor={`amenity-${amenity}`}
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
                Concierge
              </h4>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_concierge_property_add"
                  checked={formData.is_concierge}
                  onChange={(e) =>
                    setFormData({ ...formData, is_concierge: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="is_concierge_property_add"
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
                            Math.min(23, parseInt(inputVal) || 0)
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
                            Math.min(23, parseInt(inputVal) || 0)
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
                  id="pet_policy_property_add"
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
                  htmlFor="pet_policy_property_add"
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
                                          size.value || undefined
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
                  id="smoking_area_property_add"
                  checked={formData.smoking_area}
                  onChange={(e) =>
                    !isFieldReadonly &&
                    setFormData({ ...formData, smoking_area: e.target.checked })
                  }
                  disabled={isFieldReadonly}
                  className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${
                    isFieldReadonly ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
                <label
                  htmlFor="smoking_area_property_add"
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
                    MP4, AVI
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
              disabled={isLoading || isSubmitting}
              className="px-6 py-2.5 text-white/90 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-medium border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
