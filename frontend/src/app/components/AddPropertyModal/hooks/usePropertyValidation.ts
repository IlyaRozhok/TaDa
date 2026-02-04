import { useFormValidation, ValidationRules, commonRules } from "../../../hooks/useFormValidation";

// Validation rules for property form
export const propertyValidationRules: ValidationRules = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-'.,()]+$/,
  },
  apartment_number: {
    maxLength: 20,
    pattern: /^[a-zA-Z0-9\-\/]+$/,
  },
  description: {
    maxLength: 1000,
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200,
  },
  price: {
    required: true,
    pattern: /^\d+(\.\d{1,2})?$/,
    min: 0,
  },
  security_deposit: {
    pattern: /^\d+(\.\d{1,2})?$/,
    min: 0,
  },
  admin_fee: {
    pattern: /^\d+(\.\d{1,2})?$/,
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
  size_sqm: {
    min: 1,
    max: 1000,
  },
  floor: {
    min: -5,
    max: 100,
  },
  minimum_stay: {
    min: 1,
    max: 60,
  },
  maximum_stay: {
    min: 1,
    max: 60,
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
  available_from: {
    required: true,
  },
};

export const usePropertyValidation = () => {
  return useFormValidation(propertyValidationRules);
};