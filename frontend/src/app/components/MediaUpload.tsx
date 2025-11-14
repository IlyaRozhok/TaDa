"use client";

import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

interface MediaFile {
  id: string;
  file: File; // Store the actual File object
  url: string; // Local blob URL for preview
  type: "image" | "video";
  name: string;
  size: number;
  isUploading?: boolean;
}

interface MediaUploadProps {
  onFilesSelected?: (files: MediaFile[]) => void;
  onFileRemoved?: (fileId: string) => void;
  maxFiles?: number;
  acceptedTypes?: string;
  disabled?: boolean;
  ref?: React.RefObject<MediaUploadRef>;
}

export interface MediaUploadRef {
  uploadFiles: (propertyId: string, accessToken: string) => Promise<void>;
}

const MediaUpload = forwardRef<MediaUploadRef, MediaUploadProps>(
  (
    {
      onFilesSelected,
      onFileRemoved,
      maxFiles = 10,
      acceptedTypes = "image/*,video/*",
      disabled = false,
    },
    ref
  ) => {
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
      if (!disabled) {
        fileInputRef.current?.click();
      }
    };

    const validateFile = (file: File): string | null => {
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return `File "${file.name}" is too large. Maximum size is 10MB.`;
      }

      // Check file type
      const allowedTypes = [
        // Images
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
        // Videos
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-ms-wmv",
      ];

      if (!allowedTypes.includes(file.type)) {
        return `File "${file.name}" has an unsupported format. Please use images (JPEG, PNG, GIF, WebP) or videos (MP4, MPEG, MOV, AVI, WMV).`;
      }

      return null;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      // Check total file count
      if (mediaFiles.length + files.length > maxFiles) {
        setError(
          `Maximum ${maxFiles} files allowed. You can upload ${
            maxFiles - mediaFiles.length
          } more files.`
        );
        return;
      }

      // Validate each file
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      setError(null);

      // Create MediaFile objects for local storage
      const newMediaFiles: MediaFile[] = files.map((file) => ({
        id: `local-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`,
        file: file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("image/") ? "image" : "video",
        name: file.name,
        size: file.size,
      }));

      const updatedFiles = [...mediaFiles, ...newMediaFiles];
      setMediaFiles(updatedFiles);

      // Notify parent component
      onFilesSelected?.(updatedFiles);

      // Clear input
      e.target.value = "";
    };

    const handleDelete = (fileId: string) => {
      const fileToDelete = mediaFiles.find((f) => f.id === fileId);
      if (fileToDelete) {
        // Clean up blob URL
        URL.revokeObjectURL(fileToDelete.url);
      }

      const updatedFiles = mediaFiles.filter((file) => file.id !== fileId);
      setMediaFiles(updatedFiles);

      // Notify parent component
      onFileRemoved?.(fileId);
      onFilesSelected?.(updatedFiles);
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Function to upload files after property creation
    const uploadFiles = async (
      propertyId: string,
      accessToken: string
    ): Promise<void> => {
      if (mediaFiles.length === 0) return;

      // Mark all files as uploading
      setMediaFiles((prev) =>
        prev.map((file) => ({ ...file, isUploading: true }))
      );

      try {
        for (const mediaFile of mediaFiles) {
          const formData = new FormData();
          formData.append("file", mediaFile.file);

          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
            }/properties/${propertyId}/media`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: formData,
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || `Upload failed: ${response.status}`
            );
          }
        }

        // Clear files after successful upload
        mediaFiles.forEach((file) => URL.revokeObjectURL(file.url));
        setMediaFiles([]);
        onFilesSelected?.([]);
      } catch (err) {
        // Reset uploading state on error
        setMediaFiles((prev) =>
          prev.map((file) => ({ ...file, isUploading: false }))
        );
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        console.error("Upload error:", err);
        throw err; // Re-throw to allow parent to handle
      }
    };

    // Expose uploadFiles method to parent component
    useImperativeHandle(ref, () => ({
      uploadFiles,
    }));

    return (
      <div className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled
              ? "border-slate-200 bg-slate-50"
              : "border-slate-300 hover:border-slate-400"
          }`}
        >
          <div className="space-y-4">
            <div className="text-slate-600">
              <p className="text-base font-medium">Select images and videos</p>
              <p className="text-sm">Max {maxFiles} files, 10MB each</p>
              <p className="text-xs text-slate-500 mt-1">
                Supported: JPEG, PNG, GIF, WebP, MP4, MPEG, MOV, AVI, WMV
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Files will be uploaded after property creation
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes}
              onChange={handleFileSelect}
              disabled={disabled || mediaFiles.length >= maxFiles}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleButtonClick}
              disabled={disabled || mediaFiles.length >= maxFiles}
              className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-6 py-3 text-sm"
            >
              {mediaFiles.some((f) => f.isUploading) ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </div>
              ) : (
                `Choose Files`
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 text-red-400 mt-0.5">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Media Grid */}
        {mediaFiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaFiles.map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <div className="text-slate-600 text-center">
                        <div className="text-3xl mb-2">🎥</div>
                        <div className="text-xs font-medium truncate px-2">
                          {media.name}
                        </div>
                      </div>
                    </div>
                  )}

                  {media.isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <div className="text-sm">Uploading...</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs text-slate-600">
                  <div className="truncate font-medium">{media.name}</div>
                  <div className="text-slate-500">
                    {formatFileSize(media.size)}
                  </div>
                </div>

                {!media.isUploading && (
                  <button
                    onClick={() => handleDelete(media.id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Delete file"
                  >
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

MediaUpload.displayName = "MediaUpload";

export default MediaUpload;

// Export the MediaFile type for use in parent components
export type { MediaFile };
