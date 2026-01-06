import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface ValidationErrors {
  [field: string]: string;
}

export interface ValidationState {
  errors: ValidationErrors;
  touched: { [field: string]: boolean };
  isValid: boolean;
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [field: string]: boolean }>({});

  const validateField = useCallback((field: string, value: any): string => {
    const rule = rules[field];
    if (!rule) return '';

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return '';
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `Minimum ${rule.minLength} characters required`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Maximum ${rule.maxLength} characters allowed`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Invalid format';
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Minimum value is ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Maximum value is ${rule.max}`;
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) return customError;
    }

    return '';
  }, [rules]);

  const validate = useCallback((field: string, value: any) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
    return error;
  }, [validateField]);

  const validateAll = useCallback((formData: any) => {
    const newErrors: ValidationErrors = {};
    const newTouched: { [field: string]: boolean } = {};
    
    Object.keys(rules).forEach(field => {
      newTouched[field] = true;
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    setTouched(newTouched);
    
    return Object.keys(newErrors).length === 0;
  }, [rules, validateField]);

  const setFieldTouched = useCallback((field: string, isTouched: boolean = true) => {
    setTouched(prev => ({
      ...prev,
      [field]: isTouched
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    touched,
    isValid,
    validate,
    validateAll,
    setFieldTouched,
    clearErrors
  };
};

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  postcode: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
  url: /^https?:\/\/.+/,
  price: /^\d+(\.\d{1,2})?$/,
};

// Common validation rules
export const commonRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: validationPatterns.email 
  },
  phone: { 
    pattern: validationPatterns.phone,
    custom: (value: string) => {
      if (value && value.replace(/\D/g, '').length < 7) {
        return 'Phone number too short';
      }
      return null;
    }
  },
  price: {
    min: 0,
    custom: (value: number) => {
      if (value !== null && value !== undefined && value < 0) {
        return 'Price cannot be negative';
      }
      return null;
    }
  },
  positiveNumber: {
    min: 1,
    custom: (value: number) => {
      if (value !== null && value !== undefined && value <= 0) {
        return 'Must be a positive number';
      }
      return null;
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-'.,()]+$/
  },
  address: {
    minLength: 5,
    maxLength: 200
  }
};
