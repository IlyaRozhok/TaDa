/**
 * Avatar Upload Component
 * 
 * Handles avatar image selection, preview, and cropping functionality.
 * Separated from main ProfileForm for better maintainability.
 */

import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Camera, Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui';
import { AvatarCropModal } from '../AvatarCropModal';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (file: File | null) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export function AvatarUpload({
  currentAvatarUrl,
  onAvatarChange,
  isUploading = false,
  disabled = false,
}: AvatarUploadProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImageToCrop(previewUrl);
    setShowCropModal(true);
  }, []);

  const handleCropComplete = useCallback((croppedBlob: Blob) => {
    // Convert Blob to File
    const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: croppedBlob.type || 'image/jpeg' });
    setAvatarPreview(URL.createObjectURL(croppedFile));
    onAvatarChange(croppedFile);
    setShowCropModal(false);
    setImageToCrop(null);
  }, [onAvatarChange]);

  const handleCropCancel = useCallback(() => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setShowCropModal(false);
    setImageToCrop(null);
  }, [imageToCrop]);

  const handleRemoveAvatar = useCallback(() => {
    setAvatarPreview(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onAvatarChange]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayAvatarUrl = avatarPreview || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Preview */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
          {displayAvatarUrl ? (
            <img
              src={displayAvatarUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Camera size={32} />
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {/* Remove button */}
        {displayAvatarUrl && !isUploading && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            disabled={disabled}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleUploadClick}
        disabled={disabled || isUploading}
        icon={<Upload size={16} />}
      >
        {displayAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}
      </Button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Crop Modal */}
      {showCropModal && imageToCrop && (
        <AvatarCropModal
          imageSrc={imageToCrop}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}