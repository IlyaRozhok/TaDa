import {
  useFormValidation,
  ValidationRules,
} from "../../../hooks/useFormValidation";
import { PropertyFormData } from "../types";

// Validation rules aligned with Edit Property / API
export const propertyValidationRules: ValidationRules = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  apartment_number: {
    maxLength: 20,
  },
  descriptions: {
    maxLength: 2000,
  },
  address: {
    required: true,
    minLength: 5,
    maxLength: 200,
  },
  price: {
    required: true,
    min: 0,
  },
  deposit: {
    min: 0,
  },
  bedrooms: {
    required: true,
    min: 0,
    max: 10,
  },
  bathrooms: {
    required: true,
    min: 0,
    max: 10,
  },
  square_meters: {
    min: 0,
    max: 1000,
  },
  floor: {
    min: -5,
    max: 100,
  },
  building_type: {
    required: true,
  },
  property_type: {
    required: true,
  },
  furnishing: {
    required: true,
  },
  bills: {
    required: true,
  },
};

export const usePropertyValidation = () => {
  return useFormValidation(propertyValidationRules);
};
