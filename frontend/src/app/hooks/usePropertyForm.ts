import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/store/hooks";
import { propertiesAPI } from "@/app/lib/api";
import { CreatePropertyRequest } from "@/app/types";
import { Property, PropertyMedia } from "@/app/types";
import { validateForm, propertyValidationRules } from "@/app/lib/validation";

interface FormErrors {
  [key: string]: string;
}

interface UsePropertyFormReturn {
  property: Property | null;
  media: PropertyMedia[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  formErrors: FormErrors;
  formData: CreatePropertyRequest;
  setFormData: React.Dispatch<React.SetStateAction<CreatePropertyRequest>>;
  setMedia: React.Dispatch<React.SetStateAction<PropertyMedia[]>>;
  handleSave: () => Promise<void>;
  validateForm: () => boolean;
  clearErrors: () => void;
  clearSuccess: () => void;
}

export const usePropertyForm = (): UsePropertyFormReturn => {
  const { id } = useParams();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const [property, setProperty] = useState<Property | null>(null);
  const [media, setMedia] = useState<PropertyMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CreatePropertyRequest>({
    title: "",
    description: "",
    address: "",
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    furnishing: "furnished",
    lifestyle_features: [],
    available_from: "",
    is_btr: false,
  });

  // Load property data
  useEffect(() => {
    const loadProperty = async () => {
      if (!id || !accessToken) return;

      try {
        setLoading(true);
        setError(null);

        const response = await propertiesAPI.getById(id as string);
        const propertyData = response.data;
        setProperty(propertyData);

        // Populate form with existing data
        setFormData({
          title: propertyData.title || "",
          description: propertyData.description || "",
          address: propertyData.address || "",
          price: propertyData.price || 0,
          bedrooms: propertyData.bedrooms || 1,
          bathrooms: propertyData.bathrooms || 1,
          property_type: propertyData.property_type || "apartment",
          furnishing: propertyData.furnishing || "furnished",
          lifestyle_features: propertyData.lifestyle_features || [],
          available_from: propertyData.available_from || "",
          is_btr: propertyData.is_btr || false,
        });

        // Set media
        if (propertyData.media) {
          setMedia(propertyData.media);
        }
      } catch (err: any) {
        console.error("Error loading property:", err);
        setError(err.message || "Failed to load property");
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id, accessToken]);

  const validateFormData = useCallback((): boolean => {
    const result = validateForm(formData, propertyValidationRules);
    setFormErrors(result.errors);
    return result.isValid;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validateFormData()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const requestData = {
        ...formData,
        media_ids: media.map((m) => m.id).filter(Boolean),
      };

      if (id) {
        // Update existing property
        await propertiesAPI.update(id as string, requestData);
        setSuccess("Property updated successfully!");
      } else {
        // Create new property
        const response = await propertiesAPI.create(requestData);
        const newProperty = response.data;
        setSuccess("Property created successfully!");
        router.push(`/app/properties/${newProperty.id}/edit`);
      }
    } catch (err: any) {
      console.error("Error saving property:", err);
      setError(err.message || "Failed to save property");
    } finally {
      setSaving(false);
    }
  }, [formData, media, id, validateFormData, router]);

  const clearErrors = useCallback(() => {
    setError(null);
    setFormErrors({});
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(null);
  }, []);

  return {
    property,
    media,
    loading,
    saving,
    error,
    success,
    formErrors,
    formData,
    setFormData,
    setMedia,
    handleSave,
    validateForm: validateFormData,
    clearErrors,
    clearSuccess,
  };
};
