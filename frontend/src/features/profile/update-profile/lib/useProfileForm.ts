/**
 * Profile Form State Management Hook
 * 
 * Manages form state, validation, and submission for profile updates.
 * Extracted from ProfileForm component for better separation of concerns.
 */

import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { User, UpdateUserData } from '@/entities/user/model/types';
import { buildFormDataFromUser } from '@/entities/user/lib/utils';
import { authAPI } from '@/app/lib/api';
import { updateUser } from '@/app/store/slices/authSlice';

interface ProfileFormState {
  formData: UpdateUserData;
  hasChanges: boolean;
  isLoading: boolean;
  isSaving: boolean;
  errors: Partial<Record<keyof UpdateUserData, string>>;
}

interface ProfileFormActions {
  updateField: (field: keyof UpdateUserData, value: string) => void;
  updateAvatar: (file: File | null) => void;
  saveProfile: () => Promise<void>;
  resetForm: () => void;
  validateField: (field: keyof UpdateUserData, value: string) => string | null;
}

export function useProfileForm(user: User | null): ProfileFormState & ProfileFormActions {
  const dispatch = useDispatch();
  
  // State
  const [formData, setFormData] = useState<UpdateUserData>(() => 
    buildFormDataFromUser(user)
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateUserData, string>>>({});

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      const newFormData = buildFormDataFromUser(user);
      setFormData(newFormData);
      setHasChanges(false);
      setErrors({});
    }
  }, [user]);

  // Validation functions
  const validateEmail = useCallback((email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  }, []);

  const validatePhone = useCallback((phone: string): string | null => {
    if (!phone) return null; // Phone is optional
    // Basic phone validation - adjust as needed
    if (phone.length < 10) return 'Phone number is too short';
    return null;
  }, []);

  const validateDateOfBirth = useCallback((date: string): string | null => {
    if (!date) return null; // Date is optional
    
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 16) return 'You must be at least 16 years old';
    if (age > 120) return 'Please enter a valid date of birth';
    
    return null;
  }, []);

  const validateField = useCallback((field: keyof UpdateUserData, value: string): string | null => {
    switch (field) {
      case 'first_name':
        return !value ? 'First name is required' : null;
      case 'last_name':
        return !value ? 'Last name is required' : null;
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'date_of_birth':
        return validateDateOfBirth(value);
      default:
        return null;
    }
  }, [validateEmail, validatePhone, validateDateOfBirth]);

  // Actions
  const updateField = useCallback((field: keyof UpdateUserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }));
    
    // Validate field
    const error = validateField(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [validateField]);

  const updateAvatar = useCallback((file: File | null) => {
    // Handle avatar file - this would typically involve uploading to a service
    // For now, just update the form data
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar_url: previewUrl }));
      setHasChanges(true);
    } else {
      setFormData(prev => ({ ...prev, avatar_url: undefined }));
      setHasChanges(true);
    }
  }, []);

  const saveProfile = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setIsLoading(true);

    try {
      // Validate all fields
      const newErrors: Partial<Record<keyof UpdateUserData, string>> = {};
      let hasValidationErrors = false;

      Object.entries(formData).forEach(([key, value]) => {
        const error = validateField(key as keyof UpdateUserData, String(value || ''));
        if (error) {
          newErrors[key as keyof UpdateUserData] = error;
          hasValidationErrors = true;
        }
      });

      if (hasValidationErrors) {
        setErrors(newErrors);
        return;
      }

      // Save to API
      const response = await authAPI.updateProfile(formData);
      
      // Update Redux store
      dispatch(updateUser(response.data));
      
      setHasChanges(false);
      setErrors({});
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Handle API validation errors
      if (error.response?.data?.details?.validationErrors) {
        const apiErrors: Partial<Record<keyof UpdateUserData, string>> = {};
        error.response.data.details.validationErrors.forEach((err: any) => {
          apiErrors[err.field as keyof UpdateUserData] = err.message;
        });
        setErrors(apiErrors);
      } else {
        // Generic error
        setErrors({ email: error.message || 'Failed to update profile' });
      }
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  }, [formData, validateField, dispatch]);

  const resetForm = useCallback(() => {
    if (user) {
      setFormData(buildFormDataFromUser(user));
      setHasChanges(false);
      setErrors({});
    }
  }, [user]);

  return {
    // State
    formData,
    hasChanges,
    isLoading,
    isSaving,
    errors,
    
    // Actions
    updateField,
    updateAvatar,
    saveProfile,
    resetForm,
    validateField,
  };
}