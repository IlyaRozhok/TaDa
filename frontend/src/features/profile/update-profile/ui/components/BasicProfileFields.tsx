/**
 * Basic Profile Fields Component
 * 
 * Handles basic profile information fields (name, email, address, etc.).
 * Separated from main ProfileForm for better organization.
 */

import React from 'react';

import { DateInput } from '@/shared/ui';
import { InputField } from '@/app/components/preferences/ui/InputField';
import { UpdateUserData } from '@/entities/user/model/types';

interface BasicProfileFieldsProps {
  formData: UpdateUserData;
  onFieldChange: (field: keyof UpdateUserData, value: string) => void;
  errors?: Partial<Record<keyof UpdateUserData, string>>;
  disabled?: boolean;
}

export function BasicProfileFields({
  formData,
  onFieldChange,
  errors = {},
  disabled = false,
}: BasicProfileFieldsProps): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="First Name"
          value={formData.first_name || ''}
          onChange={(value) => onFieldChange('first_name', value)}
          placeholder="Enter your first name"
          required
          disabled={disabled}
          error={errors.first_name}
        />

        <InputField
          label="Last Name"
          value={formData.last_name || ''}
          onChange={(value) => onFieldChange('last_name', value)}
          placeholder="Enter your last name"
          required
          disabled={disabled}
          error={errors.last_name}
        />
      </div>

      {/* Email Field */}
      <InputField
        label="Email Address"
        type="email"
        value={formData.email || ''}
        onChange={(value) => onFieldChange('email', value)}
        placeholder="Enter your email address"
        required
        disabled={disabled}
        error={errors.email}
      />

      {/* Address Field */}
      <InputField
        label="Address"
        value={formData.address || ''}
        onChange={(value) => onFieldChange('address', value)}
        placeholder="Enter your address"
        disabled={disabled}
        error={errors.address}
        multiline
        rows={3}
      />

      {/* Date of Birth */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Date of Birth
        </label>
        <DateInput
          value={formData.date_of_birth || ''}
          onChange={(value) => onFieldChange('date_of_birth', value)}
          placeholder="Select your date of birth"
          disabled={disabled}
          error={errors.date_of_birth}
          maxDate={new Date()} // Can't be in the future
          yearRange={[1950, new Date().getFullYear() - 16]} // Min age 16
        />
      </div>

      {/* Nationality */}
      <InputField
        label="Nationality"
        value={formData.nationality || ''}
        onChange={(value) => onFieldChange('nationality', value)}
        placeholder="Enter your nationality"
        disabled={disabled}
        error={errors.nationality}
      />

      {/* Occupation */}
      <InputField
        label="Occupation"
        value={formData.occupation || ''}
        onChange={(value) => onFieldChange('occupation', value)}
        placeholder="Enter your occupation"
        disabled={disabled}
        error={errors.occupation}
      />
    </div>
  );
}