export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateField = (
  value: any,
  rules: ValidationRule,
  fieldName: string
): string | null => {
  // Required check
  if (
    rules.required &&
    (!value || (typeof value === "string" && value.trim() === ""))
  ) {
    return `${fieldName} is required`;
  }

  // Skip other validations if value is empty and not required
  if (!value && !rules.required) {
    return null;
  }

  // Type-specific validations
  if (typeof value === "string") {
    // Length validations
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
  }

  if (typeof value === "number") {
    // Numeric validations
    if (rules.min !== undefined && value < rules.min) {
      return `${fieldName} must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return `${fieldName} must be no more than ${rules.max}`;
    }
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
};

export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationResult => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((fieldName) => {
    const fieldRules = rules[fieldName];
    const value = data[fieldName];
    const error = validateField(value, fieldRules, fieldName);

    if (error) {
      errors[fieldName] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  },
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
  },
  url: {
    pattern: /^https?:\/\/.+/,
  },
  required: {
    required: true,
  },
  optional: {},
};

// Property-specific validation rules
export const propertyValidationRules = {
  title: {
    required: true,
    minLength: 10,
    maxLength: 100,
  },
  description: {
    required: true,
    minLength: 20,
    maxLength: 1000,
  },
  address: {
    required: true,
    minLength: 10,
  },
  price: {
    required: true,
    min: 1,
    max: 100000,
  },
  bedrooms: {
    required: true,
    min: 1,
    max: 10,
  },
  bathrooms: {
    required: true,
    min: 1,
    max: 10,
  },
  available_from: {
    required: true,
    custom: (value: string) => {
      if (!value) return "Available from date is required";
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today) {
        return "Available from date cannot be in the past";
      }
      return null;
    },
  },
};

// User preferences validation rules
export const preferencesValidationRules = {
  primary_postcode: {
    required: true,
    pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
  },
  min_price: {
    required: true,
    min: 0,
    max: 100000,
  },
  max_price: {
    required: true,
    min: 0,
    max: 100000,
    custom: (value: number, data?: any) => {
      if (data?.min_price && value < data.min_price) {
        return "Maximum price must be greater than minimum price";
      }
      return null;
    },
  },
  min_bedrooms: {
    required: true,
    min: 1,
    max: 10,
  },
  max_bedrooms: {
    required: true,
    min: 1,
    max: 10,
    custom: (value: number, data?: any) => {
      if (data?.min_bedrooms && value < data.min_bedrooms) {
        return "Maximum bedrooms must be greater than minimum bedrooms";
      }
      return null;
    },
  },
};

// Utility functions for specific validations
export const validateEmail = (email: string): boolean => {
  return commonRules.email.pattern.test(email);
};

export const validatePassword = (password: string): boolean => {
  return commonRules.password.pattern.test(password) && password.length >= 8;
};

export const validatePostcode = (postcode: string): boolean => {
  return preferencesValidationRules.primary_postcode.pattern.test(postcode);
};

export const validatePriceRange = (
  minPrice: number,
  maxPrice: number
): boolean => {
  return minPrice > 0 && maxPrice > 0 && maxPrice >= minPrice;
};

export const validateDateRange = (
  startDate: string,
  endDate: string
): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

// Async validation support
export const validateAsync = async (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>,
  asyncValidators?: Record<string, (value: any) => Promise<string | null>>
): Promise<ValidationResult> => {
  const result = validateForm(data, rules);

  if (asyncValidators) {
    const asyncErrors: Record<string, string> = {};

    for (const [fieldName, validator] of Object.entries(asyncValidators)) {
      const value = data[fieldName];
      if (value) {
        const error = await validator(value);
        if (error) {
          asyncErrors[fieldName] = error;
        }
      }
    }

    return {
      isValid:
        Object.keys(result.errors).length === 0 &&
        Object.keys(asyncErrors).length === 0,
      errors: { ...result.errors, ...asyncErrors },
    };
  }

  return result;
};
