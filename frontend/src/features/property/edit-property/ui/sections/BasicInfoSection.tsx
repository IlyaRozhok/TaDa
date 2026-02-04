/**
 * Basic Information Section
 * 
 * Handles basic property information (title, description, type, etc.)
 */

import React from 'react';
import { Input, Textarea, Card, VStack } from '@/shared/ui';
import { PropertyFormData } from '../../model/types';

interface BasicInfoSectionProps {
  data: PropertyFormData;
  errors: Record<string, string>;
  onChange: (field: keyof PropertyFormData, value: any) => void;
  disabled?: boolean;
}

export function BasicInfoSection({
  data,
  errors,
  onChange,
  disabled = false,
}: BasicInfoSectionProps): JSX.Element {
  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'studio', label: 'Studio' },
    { value: 'room', label: 'Room' },
    { value: 'shared_room', label: 'Shared Room' },
  ];

  const buildingTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'mixed_use', label: 'Mixed Use' },
  ];

  const furnishingOptions = [
    { value: 'unfurnished', label: 'Unfurnished' },
    { value: 'part_furnished', label: 'Part Furnished' },
    { value: 'furnished', label: 'Furnished' },
  ];

  const billsOptions = [
    { value: 'included', label: 'Bills Included' },
    { value: 'excluded', label: 'Bills Excluded' },
    { value: 'partial', label: 'Some Bills Included' },
  ];

  return (
    <Card variant="outlined" padding="lg">
      <VStack spacing="lg">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Provide the essential details about your property
          </p>
        </div>

        <VStack spacing="md">
          {/* Property Title */}
          <Input
            label="Property Title"
            placeholder="e.g., Modern 2-bedroom apartment in Central London"
            value={data.title}
            onChange={(e) => onChange('title', e.target.value)}
            error={errors.title}
            disabled={disabled}
            required
            hint="Make it descriptive and appealing to potential tenants"
          />

          {/* Property Description */}
          <Textarea
            label="Property Description"
            placeholder="Describe your property in detail..."
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            error={errors.description}
            disabled={disabled}
            required
            rows={4}
            hint="Include key features, nearby amenities, and what makes this property special"
          />

          {/* Property Type & Building Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                value={data.property_type}
                onChange={(e) => onChange('property_type', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.property_type && (
                <p className="text-xs text-red-600 mt-1">{errors.property_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building Type <span className="text-red-500">*</span>
              </label>
              <select
                value={data.building_type}
                onChange={(e) => onChange('building_type', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                {buildingTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.building_type && (
                <p className="text-xs text-red-600 mt-1">{errors.building_type}</p>
              )}
            </div>
          </div>

          {/* Furnishing & Bills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Furnishing
              </label>
              <select
                value={data.furnishing}
                onChange={(e) => onChange('furnishing', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                {furnishingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bills
              </label>
              <select
                value={data.bills}
                onChange={(e) => onChange('bills', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                {billsOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </VStack>
      </VStack>
    </Card>
  );
}