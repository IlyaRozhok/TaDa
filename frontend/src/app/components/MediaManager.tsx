"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { PropertyMedia } from "../types";
import { propertyMediaAPI } from "../lib/api";
import {
  Upload,
  X,
  GripVertical,
  Image as ImageIcon,
  Video as VideoIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
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
  console.log("🎬 MediaManager props:", {
    propertyId,
    mediaCount: media?.length || 0,
    accessToken: !!accessToken,
    disabled,
  });
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<PropertyMedia | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<PropertyMedia | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep media list sorted by order_index; used across the component
  const sortedMedia = useMemo(
    () => [...media].sort((a, b) => a.order_index - b.order_index),
    [media]
  );

  // Keyboard controls for fullscreen viewer
  useEffect(() => {
    if (!fullscreenImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenImage(null);
      }
      if (e.key === "ArrowLeft") {
        const currentIndex = sortedMedia.findIndex(
          (m) => m.id === fullscreenImage.id
        );
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : sortedMedia.length - 1;
        setFullscreenImage(sortedMedia[prevIndex]);
      }
      if (e.key === "ArrowRight") {
        const currentIndex = sortedMedia.findIndex(
          (m) => m.id === fullscreenImage.id
        );
        const nextIndex =
          currentIndex < sortedMedia.length - 1 ? currentIndex + 1 : 0;
        setFullscreenImage(sortedMedia[nextIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImage, sortedMedia]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateFile = (file: File): string | null => {
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
    [disabled, media.length, uploadingFiles.length]
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

    // Use sortedMedia indices since that's what we're displaying
    const draggedIndex = sortedMedia.findIndex((m) => m.id === draggedItem);
    const targetIndex = sortedMedia.findIndex((m) => m.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new order based on sortedMedia
    const newMedia = [...sortedMedia];
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

  // sortedMedia is defined above via useMemo

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
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
          disabled
            ? "border-gray-200 bg-gray-50"
            : "border-blue-300 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900">Upload Photos</p>
            <p className="text-sm text-gray-600">
              Drag & drop or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 underline"
              >
                browse
              </button>{" "}
              • JPG, PNG, WebP
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-blue-600 font-medium">
              {media.length + uploadingFiles.length}
            </p>
            <p className="text-xs text-gray-500">files</p>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              Property Photos ({sortedMedia.length})
            </h4>
            <div className="text-xs text-gray-500">Drag photos to reorder</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedMedia.map((mediaItem) => (
              <div
                key={mediaItem.id}
                className={`relative group bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
                  draggedItem === mediaItem.id ? "opacity-50 scale-95" : ""
                } ${
                  disabled
                    ? "pointer-events-none"
                    : "cursor-move hover:border-blue-300"
                } ${
                  mediaItem.is_featured
                    ? "ring-2 ring-yellow-400 border-yellow-300"
                    : ""
                }`}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, mediaItem.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDragDrop(e, mediaItem.id)}
              >
                {/* Media Preview */}
                <div className="aspect-square bg-gray-100 relative">
                  {mediaItem.type === "image" ? (
                    <>
                      <img
                        src={mediaItem.url || mediaItem.s3_url}
                        alt={mediaItem.original_filename || "Property image"}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => setFullscreenImage(mediaItem)}
                        onLoad={() =>
                          console.log(
                            "✅ Image loaded:",
                            mediaItem.url || mediaItem.s3_url
                          )
                        }
                        onError={(e) => {
                          console.error(
                            "❌ Image failed to load:",
                            mediaItem.url || mediaItem.s3_url
                          );
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                      <div className="hidden w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">
                            Image failed to load
                          </p>
                          <p className="text-xs text-gray-400 mt-1 break-all px-2">
                            {mediaItem.original_filename}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <div className="text-center">
                        <VideoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Video</p>
                      </div>
                    </div>
                  )}

                  {/* Debug info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="truncate">
                      URL: {mediaItem.url || mediaItem.s3_url || "No URL"}
                    </p>
                    <p className="truncate">Type: {mediaItem.type}</p>
                  </div>
                </div>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  {/* Actions - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => setFullscreenImage(mediaItem)}
                      className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 hover:scale-105 transition-all duration-200 shadow-lg"
                      title="View full size"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(mediaItem)}
                      className="p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600/90 hover:scale-105 transition-all duration-200 shadow-lg"
                      title="Delete image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drag Handle - Bottom Left */}
                  <div className="absolute bottom-2 left-2">
                    <div className="p-1 bg-white/20 rounded-full">
                      <GripVertical className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* File Info - Bottom Right */}
                  <div className="absolute bottom-2 right-2">
                    <div className="bg-black/50 rounded-lg px-2 py-1">
                      <p className="text-xs text-white font-medium">
                        {mediaItem.original_filename
                          ?.split(".")
                          .pop()
                          ?.toUpperCase()}
                      </p>
                    </div>
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

      {/* Empty State */}
      {sortedMedia.length === 0 && uploadingFiles.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No photos yet
          </h3>
          <p className="text-gray-500 mb-4">
            Upload some beautiful photos to showcase this property
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload First Photo
          </button>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/90 z-[9999]">
          <div className="relative w-screen h-screen flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {sortedMedia.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const currentIndex = sortedMedia.findIndex(
                      (m) => m.id === fullscreenImage.id
                    );
                    const prevIndex =
                      currentIndex > 0
                        ? currentIndex - 1
                        : sortedMedia.length - 1;
                    setFullscreenImage(sortedMedia[prevIndex]);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    const currentIndex = sortedMedia.findIndex(
                      (m) => m.id === fullscreenImage.id
                    );
                    const nextIndex =
                      currentIndex < sortedMedia.length - 1
                        ? currentIndex + 1
                        : 0;
                    setFullscreenImage(sortedMedia[nextIndex]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={fullscreenImage.url || fullscreenImage.s3_url}
              alt={fullscreenImage.original_filename || "Property image"}
              className="w-auto h-auto max-w-[100vw] max-h-[100vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {fullscreenImage.original_filename}
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">
                    {fullscreenImage.is_featured && "⭐ Featured • "}
                    {sortedMedia.findIndex((m) => m.id === fullscreenImage.id) +
                      1}{" "}
                    of {sortedMedia.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(fullscreenImage);
                      setFullscreenImage(null);
                    }}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title="Delete image"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setFullscreenImage(null)}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Photo
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={deleteConfirm.url || deleteConfirm.s3_url}
                    alt={deleteConfirm.original_filename}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {deleteConfirm.original_filename}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this photo? It will be
                permanently removed from the property.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
