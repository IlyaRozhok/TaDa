"use client";

import React, { useState, useRef, useCallback } from "react";
import { PropertyMedia } from "../types";
import { propertyMediaAPI } from "../lib/api";
import {
  Upload,
  X,
  Star,
  StarOff,
  GripVertical,
  Image as ImageIcon,
  Video as VideoIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface MediaManagerProps {
  propertyId: string;
  media: PropertyMedia[];
  accessToken: string;
  onMediaUpdate: (updatedMedia: PropertyMedia[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  error?: string;
}

export default function MediaManager({
  propertyId,
  media,
  accessToken,
  onMediaUpdate,
  disabled = false,
  maxFiles = 10,
}: MediaManagerProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateFile = (file: File): string | null => {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`;
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-ms-wmv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" has an unsupported format.`;
    }

    return null;
  };

  const handleFileSelect = async (files: File[]) => {
    if (disabled) return;

    // Check total file count
    const currentCount = media.length + uploadingFiles.length;
    if (currentCount + files.length > maxFiles) {
      showMessage(
        "error",
        `Maximum ${maxFiles} files allowed. You can upload ${
          maxFiles - currentCount
        } more files.`
      );
      return;
    }

    // Validate files
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        showMessage("error", validationError);
        return;
      }
    }

    // Start uploading
    const newUploads: UploadingFile[] = files.map((file) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      file,
      progress: 0,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploads]);

    // Upload files one by one
    for (const upload of newUploads) {
      try {
        setUploadingFiles((prev) =>
          prev.map((u) => (u.id === upload.id ? { ...u, progress: 50 } : u))
        );

        const uploadedMedia = await propertyMediaAPI.uploadPropertyMedia(
          propertyId,
          upload.file
        );

        setUploadingFiles((prev) =>
          prev.map((u) => (u.id === upload.id ? { ...u, progress: 100 } : u))
        );

        // Add to media list
        onMediaUpdate([...media, uploadedMedia]);

        // Remove from uploading list
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((u) => u.id !== upload.id));
        }, 1000);

        showMessage("success", `${upload.file.name} uploaded successfully`);
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : u
          )
        );
        showMessage("error", `Failed to upload ${upload.file.name}`);
      }
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      handleFileSelect(files);
    },
    [disabled, media.length, uploadingFiles.length, maxFiles]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelect(files);
      e.target.value = ""; // Reset input
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (disabled) return;

    try {
      await propertyMediaAPI.deletePropertyMedia(propertyId, mediaId);
      onMediaUpdate(media.filter((m) => m.id !== mediaId));
      showMessage("success", "Media deleted successfully");
    } catch (error) {
      showMessage("error", "Failed to delete media");
    }
  };

  const handleSetFeatured = async (mediaId: string) => {
    if (disabled) return;

    try {
      const updatedMedia = await propertyMediaAPI.setFeaturedMedia(
        propertyId,
        mediaId
      );

      // Update media list with new featured status
      const newMedia = media.map((m) => ({
        ...m,
        is_featured: m.id === mediaId,
      }));
      onMediaUpdate(newMedia);
      showMessage("success", "Featured image updated");
    } catch (error) {
      showMessage("error", "Failed to update featured image");
    }
  };

  const handleDragStart = (e: React.DragEvent, mediaId: string) => {
    setDraggedItem(mediaId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId || disabled) return;

    const draggedIndex = media.findIndex((m) => m.id === draggedItem);
    const targetIndex = media.findIndex((m) => m.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new order
    const newMedia = [...media];
    const [draggedMedia] = newMedia.splice(draggedIndex, 1);
    newMedia.splice(targetIndex, 0, draggedMedia);

    // Update order indices
    const mediaOrders = newMedia.map((m, index) => ({
      id: m.id,
      order_index: index,
    }));

    try {
      await propertyMediaAPI.updateMediaOrder(propertyId, mediaOrders);

      // Update local state with new order
      const updatedMedia = newMedia.map((m, index) => ({
        ...m,
        order_index: index,
      }));
      onMediaUpdate(updatedMedia);
      showMessage("success", "Media order updated");
    } catch (error) {
      showMessage("error", "Failed to update media order");
    }

    setDraggedItem(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const sortedMedia = [...media].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-4">
      {/* Message Display */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-current hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled
            ? "border-gray-200 bg-gray-50"
            : "border-gray-300 hover:border-gray-400 bg-white"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={(e) => e.preventDefault()}
      >
        <div className="space-y-4">
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
          <div>
            <p className="text-base font-medium text-gray-900">
              Upload media files
            </p>
            <p className="text-sm text-gray-600">
              Drag and drop files here, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxFiles} files, 10MB each • Images and videos supported
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Current: {media.length + uploadingFiles.length}/{maxFiles} files
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Uploading...</h4>
          {uploadingFiles.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0">
                {upload.file.type.startsWith("image/") ? (
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <VideoIcon className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </p>
                {upload.error ? (
                  <p className="text-xs text-red-600">{upload.error}</p>
                ) : (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {upload.progress < 100 && !upload.error && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Media Grid */}
      {sortedMedia.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Property Media ({sortedMedia.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedMedia.map((mediaItem) => (
              <div
                key={mediaItem.id}
                className={`relative group bg-white border rounded-lg overflow-hidden ${
                  draggedItem === mediaItem.id ? "opacity-50" : ""
                } ${disabled ? "pointer-events-none" : "cursor-move"}`}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, mediaItem.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDragDrop(e, mediaItem.id)}
              >
                {/* Media Preview */}
                <div className="aspect-square bg-gray-100">
                  {mediaItem.type === "image" ? (
                    <img
                      src={mediaItem.url}
                      alt={mediaItem.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all">
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Featured Star */}
                    <button
                      onClick={() => handleSetFeatured(mediaItem.id)}
                      className={`p-1 rounded-full transition-colors ${
                        mediaItem.is_featured
                          ? "bg-yellow-500 text-white"
                          : "bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                      }`}
                      title={
                        mediaItem.is_featured
                          ? "Featured image"
                          : "Set as featured"
                      }
                    >
                      {mediaItem.is_featured ? (
                        <Star className="w-4 h-4 fill-current" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(mediaItem.id)}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Delete media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drag Handle */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Media Info */}
                <div className="p-2 bg-white">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {mediaItem.original_filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(Number(mediaItem.file_size))}
                  </p>
                  {mediaItem.is_featured && (
                    <p className="text-xs text-yellow-600 font-medium">
                      Featured
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Media Message */}
      {sortedMedia.length === 0 && uploadingFiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No media files uploaded yet</p>
          <p className="text-xs">
            Upload images and videos to showcase your property
          </p>
        </div>
      )}
    </div>
  );
}
