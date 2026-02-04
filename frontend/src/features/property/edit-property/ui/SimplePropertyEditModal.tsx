/**
 * Simple Property Edit Modal
 * 
 * Clean, modular property editing interface.
 * Replaces the massive 2920-line EditPropertyModal with a maintainable solution.
 */

import React from 'react';
import { X, Save, ArrowLeft, ArrowRight } from 'lucide-react';

import { Button, Card, VStack, HStack, Container } from '@/shared/ui';
import { Property } from '@/shared/types/property';

import { usePropertyForm } from '../lib/usePropertyForm';
import { BasicInfoSection } from './sections/BasicInfoSection';

interface SimplePropertyEditModalProps {
  property?: Property;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (property: Property) => void;
}

export function SimplePropertyEditModal({
  property,
  isOpen,
  onClose,
  onSave,
}: SimplePropertyEditModalProps): JSX.Element | null {
  const {
    data,
    currentSection,
    sections,
    isLoading,
    isSaving,
    errors,
    hasChanges,
    updateField,
    setCurrentSection,
    validateSection,
    saveProperty,
    resetForm,
  } = usePropertyForm({
    property,
    onSave,
    onCancel: onClose,
  });

  if (!isOpen) return null;

  const currentSectionIndex = sections.findIndex(s => s.id === currentSection);
  const canGoNext = currentSectionIndex < sections.length - 1;
  const canGoPrev = currentSectionIndex > 0;

  const handleNext = (): void => {
    if (canGoNext && validateSection(currentSection)) {
      setCurrentSection(sections[currentSectionIndex + 1].id);
    }
  };

  const handlePrev = (): void => {
    if (canGoPrev) {
      setCurrentSection(sections[currentSectionIndex - 1].id);
    }
  };

  const handleSave = async (): Promise<void> => {
    await saveProperty();
    if (Object.keys(errors).length === 0) {
      onClose();
    }
  };

  const handleClose = (): void => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }
    resetForm();
    onClose();
  };

  const currentSectionData = sections.find(s => s.id === currentSection);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {property ? 'Edit Property' : 'Add New Property'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentSectionData?.title} ({currentSectionIndex + 1} of {sections.length})
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSaving}
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex space-x-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  disabled={isSaving}
                  className={`flex-1 text-xs py-2 px-3 rounded-md transition-colors ${
                    section.id === currentSection
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : section.completed
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{section.title}</div>
                  {section.required && (
                    <div className="text-xs opacity-75">Required</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <Container size="full" padding="none">
              {currentSection === 'basic' && (
                <BasicInfoSection
                  data={data}
                  errors={errors}
                  onChange={updateField}
                  disabled={isSaving}
                />
              )}

              {currentSection === 'location' && (
                <Card variant="outlined" padding="lg">
                  <div className="text-center py-8 text-gray-500">
                    Location section - Coming soon
                  </div>
                </Card>
              )}

              {currentSection === 'details' && (
                <Card variant="outlined" padding="lg">
                  <div className="text-center py-8 text-gray-500">
                    Property details section - Coming soon
                  </div>
                </Card>
              )}

              {/* Add other sections as needed */}
            </Container>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <HStack spacing="sm">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={!canGoPrev || isSaving}
                icon={<ArrowLeft size={16} />}
              >
                Previous
              </Button>
              
              {canGoNext ? (
                <Button
                  onClick={handleNext}
                  disabled={isSaving}
                  icon={<ArrowRight size={16} />}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={!hasChanges || isLoading}
                  icon={<Save size={16} />}
                >
                  Save Property
                </Button>
              )}
            </HStack>

            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>

          {/* Error Messages */}
          {errors.general && (
            <div className="mx-6 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}