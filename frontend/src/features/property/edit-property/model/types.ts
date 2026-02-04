/**
 * Edit Property Feature Types
 * 
 * Types specific to property editing functionality.
 */

import { Property } from '@/shared/types/property';

export interface PropertyFormData extends Omit<Property, 'id' | 'created_at' | 'updated_at'> {
  // Additional form-specific fields
  media_files?: File[];
  documents_files?: File[];
}

export interface PropertyFormSection {
  id: string;
  title: string;
  completed: boolean;
  required: boolean;
}

export interface PropertyFormState {
  data: PropertyFormData;
  currentSection: string;
  sections: PropertyFormSection[];
  isLoading: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
  hasChanges: boolean;
}

export interface PropertyFormActions {
  updateField: (field: keyof PropertyFormData, value: any) => void;
  updateSection: (sectionId: string, data: Partial<PropertyFormData>) => void;
  setCurrentSection: (sectionId: string) => void;
  validateSection: (sectionId: string) => boolean;
  saveProperty: () => Promise<void>;
  resetForm: () => void;
}

// Form validation rules
export interface ValidationRule {
  field: keyof PropertyFormData;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

// Property editing steps/sections
export const PROPERTY_FORM_SECTIONS: PropertyFormSection[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    completed: false,
    required: true,
  },
  {
    id: 'location',
    title: 'Location & Transport',
    completed: false,
    required: true,
  },
  {
    id: 'details',
    title: 'Property Details',
    completed: false,
    required: true,
  },
  {
    id: 'amenities',
    title: 'Amenities & Features',
    completed: false,
    required: false,
  },
  {
    id: 'pricing',
    title: 'Pricing & Availability',
    completed: false,
    required: true,
  },
  {
    id: 'media',
    title: 'Photos & Documents',
    completed: false,
    required: false,
  },
  {
    id: 'preferences',
    title: 'Tenant Preferences',
    completed: false,
    required: false,
  },
];