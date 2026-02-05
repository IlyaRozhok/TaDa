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
}: BasicProfileFieldsProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="First Name"
          value={formData.first_name || ''}
          onChange={(e) => onFieldChange('first_name', e.target.value)}
          placeholder="Enter your first name"
          required
          disabled={disabled}
          error={errors.first_name}
        />

        <InputField
          label="Last Name"
          value={formData.last_name || ''}
          onChange={(e) => onFieldChange('last_name', e.target.value)}
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
        onChange={(e) => onFieldChange('email', e.target.value)}
        placeholder="Enter your email address"
        required
        disabled={disabled}
        error={errors.email}
      />

      {/* Address Field */}
      <InputField
        label="Address"
        value={formData.address || ''}
        onChange={(e) => onFieldChange('address', e.target.value)}
        placeholder="Enter your address"
        disabled={disabled}
        error={errors.address}
      />

      {/* Date of Birth */}
      <DateInput
        label="Date of Birth"
        name="date_of_birth"
        value={formData.date_of_birth || null}
        onChange={(value) => onFieldChange('date_of_birth', value)}
        placeholder="Select your date of birth"
        disabled={disabled}
        error={errors.date_of_birth}
        maxDate={new Date().toISOString().split('T')[0]} // Can't be in the future
      />

      {/* Nationality */}
      <InputField
        label="Nationality"
        value={formData.nationality || ''}
          onChange={(e) => onFieldChange('nationality', e.target.value)}
        placeholder="Enter your nationality"
        disabled={disabled}
        error={errors.nationality}
      />

      {/* Occupation */}
      <InputField
        label="Occupation"
        value={formData.occupation || ''}
          onChange={(e) => onFieldChange('occupation', e.target.value)}
        placeholder="Enter your occupation"
        disabled={disabled}
        error={errors.occupation}
      />
    </div>
  );
}