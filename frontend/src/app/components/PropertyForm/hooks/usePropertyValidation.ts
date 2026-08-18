import {
  useFormValidation,
  ValidationRules,
} from "../../../hooks/useFormValidation";
import { PropertyFormData } from "../types";

export const propertyValidationRules: ValidationRules = {
  title: {
    required: true,
    minLength: 1,
  },
};

export const usePropertyValidation = () => {
  return useFormValidation(propertyValidationRules);
};
