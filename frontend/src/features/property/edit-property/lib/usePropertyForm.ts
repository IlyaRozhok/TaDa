/**
 * Property Form Management Hook
 * 
 * Manages complex property editing form state and validation.
 */

import { useState, useCallback, useEffect } from 'react';
import { Property } from '@/shared/types/property';
import { 
  PropertyFormData, 
  PropertyFormState, 
  PropertyFormActions,
  PROPERTY_FORM_SECTIONS,
  ValidationRule 
} from '../model/types';

interface UsePropertyFormProps {
  property?: Property;
  onSave?: (property: Property) => void;
  onCancel?: () => void;
}

export function usePropertyForm({
  property,
  onSave,
  onCancel,
}: UsePropertyFormProps): PropertyFormState & PropertyFormActions {
  
  // Initialize form data
  const [formData, setFormData] = useState<PropertyFormData>(() => {
    if (property) {
      const { id, created_at, updated_at, ...rest } = property;
      return rest;
    }
    return {
      title: '',
      description: '',
      property_type: 'apartment',
      status: 'draft',
      furnishing: 'unfurnished',
      bills: 'excluded',
      price: 0,
      deposit: 0,
      let_duration: 'flexible',
      available_from: '',
      bedrooms: 1,
      bathrooms: 1,
      floor: 0,
      total_floors: 0,
      address: '',
      postcode: '',
      city: '',
      country: 'UK',
      amenities: [],
      media: [],
      operator_id: '',
    } as PropertyFormData;
  });

  const [currentSection, setCurrentSection] = useState('basic');
  const [sections, setSections] = useState(PROPERTY_FORM_SECTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Validation rules for each section
  const validationRules: Record<string, ValidationRule[]> = {
    basic: [
      { field: 'title', required: true, minLength: 3, maxLength: 100 },
      { field: 'description', required: true, minLength: 10, maxLength: 1000 },
      { field: 'property_type', required: true },
    ],
    location: [
      { field: 'address', required: true, minLength: 5 },
      { field: 'postcode', required: true, minLength: 3 },
      { field: 'city', required: true, minLength: 2 },
      { field: 'country', required: true },
    ],
    details: [
      { field: 'bedrooms', required: true, custom: (value) => value > 0 ? null : 'Must be at least 1' },
      { field: 'bathrooms', required: true, custom: (value) => value > 0 ? null : 'Must be at least 1' },
      { field: 'area', required: false, custom: (value) => !value || value > 0 ? null : 'Must be greater than 0' },
    ],
    pricing: [
      { field: 'price', required: true, custom: (value) => value > 0 ? null : 'Price must be greater than 0' },
      { field: 'available_from', required: false },
    ],
  };

  // Update field value
  const updateField = useCallback((field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Update entire section
  const updateSection = useCallback((sectionId: string, data: Partial<PropertyFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setHasChanges(true);
    
    // Mark section as completed if valid
    const isValid = validateSection(sectionId);
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, completed: isValid }
        : section
    ));
  }, []);

  // Validate a specific section
  const validateSection = useCallback((sectionId: string): boolean => {
    const rules = validationRules[sectionId] || [];
    const sectionErrors: Record<string, string> = {};
    let isValid = true;

    rules.forEach(rule => {
      const value = formData[rule.field];
      
      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        sectionErrors[rule.field] = `${rule.field.replace('_', ' ')} is required`;
        isValid = false;
        return;
      }

      // Skip other validations if field is empty and not required
      if (!value) return;

      // Length validations
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        sectionErrors[rule.field] = `Must be at least ${rule.minLength} characters`;
        isValid = false;
      }

      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        sectionErrors[rule.field] = `Must be no more than ${rule.maxLength} characters`;
        isValid = false;
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        sectionErrors[rule.field] = `Invalid format`;
        isValid = false;
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          sectionErrors[rule.field] = customError;
          isValid = false;
        }
      }
    });

    setErrors(prev => ({ ...prev, ...sectionErrors }));
    return isValid;
  }, [formData]);

  // Save property
  const saveProperty = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setIsLoading(true);

    try {
      // Validate all required sections
      let allValid = true;
      sections.filter(s => s.required).forEach(section => {
        if (!validateSection(section.id)) {
          allValid = false;
        }
      });

      if (!allValid) {
        throw new Error('Please fix validation errors before saving');
      }

      // TODO: Implement actual API call
      // const result = property 
      //   ? await propertiesAPI.update(property.id, formData)
      //   : await propertiesAPI.create(formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const savedProperty = {
        ...formData,
        id: property?.id || Math.random().toString(),
        created_at: property?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Property;

      setHasChanges(false);
      onSave?.(savedProperty);
      
    } catch (error: any) {
      console.error('Error saving property:', error);
      setErrors({ general: error.message || 'Failed to save property' });
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  }, [formData, sections, property, onSave, validateSection]);

  // Reset form
  const resetForm = useCallback(() => {
    if (property) {
      const { id, created_at, updated_at, ...rest } = property;
      setFormData(rest);
    }
    setHasChanges(false);
    setErrors({});
    setCurrentSection('basic');
  }, [property]);

  // Set current section
  const setCurrentSectionHandler = useCallback((sectionId: string) => {
    setCurrentSection(sectionId);
  }, []);

  return {
    // State
    data: formData,
    currentSection,
    sections,
    isLoading,
    isSaving,
    errors,
    hasChanges,
    
    // Actions
    updateField,
    updateSection,
    setCurrentSection: setCurrentSectionHandler,
    validateSection,
    saveProperty,
    resetForm,
  };
}