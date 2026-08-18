import {
  useFormValidation,
  ValidationRules,
} from "@/app/hooks/useFormValidation";

// Validation rules for building form
const buildingValidationRules: ValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-'.,()&]+$/,
  },
  address: {
    minLength: 5,
    maxLength: 200,
  },
  number_of_units: {
    min: 1,
    max: 10000,
    custom: (value: number) => {
      if (value && !Number.isInteger(value)) {
        return "Number of units must be a whole number";
      }
      return null;
    },
  },
  operator_id: {
    required: false,
  },
};

export const useBuildingValidation = () =>
  useFormValidation(buildingValidationRules);
