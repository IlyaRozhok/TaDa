import React, { useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { X, Upload, GripVertical } from "lucide-react";
import type { EditPropertyFormData } from "../types";

interface EditPropertyMediaSectionProps {
  formData: EditPropertyFormData;
  setFormData: Dispatch<SetStateAction<EditPropertyFormData>>;
  displayPhotos: string[];
  removeExistingPhoto: (photoUrl: string) => void;
  removeNewPhoto: (index: number) => void;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photoFiles: File[];
  setPhotoFiles: Dispatch<SetStateAction<File[]>>;
  photoPreviews: string[];
  setPhotoPreviews: Dispatch<SetStateAction<string[]>>;
  videoPreview: string | null;
  setVideoFile: Dispatch<SetStateAction<File | null>>;
  documentFile: File | null;
  setDocumentFile: Dispatch<SetStateAction<File | null>>;
  removedVideo: boolean;
  setRemovedVideo: Dispatch<SetStateAction<boolean>>;
  removedDocuments: boolean;
  setRemovedDocuments: Dispatch<SetStateAction<boolean>>;
  photoInputRef: RefObject<HTMLInputElement | null>;
  videoInputRef: RefObject<HTMLInputElement | null>;
  documentInputRef: RefObject<HTMLInputElement | null>;
}

/**
 * Edit-mode media block, moved verbatim: existing photos with drag-reorder
 * and removal tracking, new-photo grid with its own drag-reorder, and the
 * video/document blocks with their removed-flags.
 */
export const EditPropertyMediaSection: React.FC<
  EditPropertyMediaSectionProps
> = ({
  formData,
  setFormData,
  displayPhotos,
  removeExistingPhoto,
  removeNewPhoto,
  handlePhotoChange,
  photoFiles,
  setPhotoFiles,
  photoPreviews,
  setPhotoPreviews,
  videoPreview,
  setVideoFile,
  documentFile,
  setDocumentFile,
  removedVideo,
  setRemovedVideo,
  removedDocuments,
  setRemovedDocuments,
  photoInputRef,
  videoInputRef,
  documentInputRef,
}) => {
  // Drag and drop state for photos
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(
    null,
  );
  const [draggedPhotoFileIndex, setDraggedPhotoFileIndex] = useState<
    number | null
  >(null);

  return (
    <>
          {/* Media Uploads */}
          <div className="space-y-4">
            {/* Existing Photos */}
            {displayPhotos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-white/90">
                    Current Photos ({displayPhotos.length})
                  </label>
                  <span className="text-xs text-white/60">Drag to reorder</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {displayPhotos.map((photo, index) => (
                    <div
                      key={`existing-photo-${photo}-${index}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedPhotoIndex(index);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (
                          draggedPhotoIndex === null ||
                          draggedPhotoIndex === index
                        ) {
                          setDraggedPhotoIndex(null);
                          return;
                        }

                        const newPhotos = [...displayPhotos];
                        const [draggedPhoto] = newPhotos.splice(
                          draggedPhotoIndex,
                          1,
                        );
                        newPhotos.splice(index, 0, draggedPhoto);

                        // Update formData with new order
                        setFormData((prev) => ({
                          ...prev,
                          photos: newPhotos,
                        }));

                        setDraggedPhotoIndex(null);
                      }}
                      className={`relative group cursor-move transition-all ${
                        draggedPhotoIndex === index ? "opacity-50 scale-95" : ""
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Current ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="absolute bottom-1 left-1">
                          <div className="p-0.5 bg-white/20 rounded-full">
                            <GripVertical className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(photo)}
                          className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Photos */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Add New Photos
              </label>
              <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-white/70 mb-2" />
                  <p className="text-sm text-white/90 font-medium">
                    Click to upload photos
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    PNG, JPG - Multiple files allowed
                  </p>
                </div>
              </label>
              {photoPreviews.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div
                      key={`new-photo-${index}-${photoFiles[index]?.name}-${photoFiles[index]?.size}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedPhotoFileIndex(index);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (
                          draggedPhotoFileIndex === null ||
                          draggedPhotoFileIndex === index
                        ) {
                          setDraggedPhotoFileIndex(null);
                          return;
                        }

                        const newFiles = [...photoFiles];
                        const [draggedFile] = newFiles.splice(
                          draggedPhotoFileIndex,
                          1,
                        );
                        newFiles.splice(index, 0, draggedFile);

                        // Update both photoFiles and photoPreviews to maintain order
                        setPhotoFiles(newFiles);

                        // Update previews order
                        const newPreviews = [...photoPreviews];
                        const [draggedPreview] = newPreviews.splice(
                          draggedPhotoFileIndex,
                          1,
                        );
                        newPreviews.splice(index, 0, draggedPreview);
                        setPhotoPreviews(newPreviews);

                        setDraggedPhotoFileIndex(null);
                      }}
                      className={`relative group cursor-move transition-all ${
                        draggedPhotoFileIndex === index
                          ? "opacity-50 scale-95"
                          : ""
                      }`}
                    >
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-green-500"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="absolute bottom-1 left-1">
                          <div className="p-0.5 bg-white/20 rounded-full">
                            <GripVertical className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video */}
            <div>
              {formData.video && !removedVideo && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Current Video
                  </label>
                  <div className="relative">
                    <video
                      src={formData.video}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                      onError={(e) => {
                        console.error("❌ Ошибка загрузки видео:", {
                          src: formData.video,
                          error: e,
                        });
                      }}
                      onLoadedData={() => {
                        console.log(
                          "✅ Видео успешно загружено:",
                          formData.video,
                        );
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setRemovedVideo(true)}
                      className="absolute top-1 right-1 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <label className="block text-sm font-medium text-white/90 mb-2">
                {formData.video && !removedVideo
                  ? "Replace Video"
                  : "Add Video"}
              </label>
              <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setVideoFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-white/70 mb-2" />
                  <p className="text-sm text-white/90 font-medium">
                    Click to upload video
                  </p>
                  <p className="text-xs text-white/60 mt-1">MP4, AVI</p>
                </div>
              </label>
              {videoPreview && (
                <div className="mt-2 relative">
                  <video
                    src={videoPreview}
                    className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
                    controls
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      if (videoInputRef.current) {
                        videoInputRef.current.value = "";
                      }
                    }}
                    className="absolute top-1 right-1 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              {formData.documents && !removedDocuments && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Current Document
                  </label>
                  <div className="flex items-center justify-between p-2 bg-slate-100 rounded-lg">
                    <a
                      href={formData.documents}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                    <button
                      type="button"
                      onClick={() => setRemovedDocuments(true)}
                      className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <label className="block text-sm font-medium text-white/90 mb-2">
                {formData.documents && !removedDocuments
                  ? "Replace Document"
                  : "Add Document"}
              </label>
              <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setDocumentFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-white/70 mb-2" />
                  <p className="text-sm text-white/90 font-medium">
                    Click to upload document
                  </p>
                  <p className="text-xs text-white/60 mt-1">PDF file</p>
                </div>
              </label>
              {documentFile && (
                <div className="mt-2 flex items-center justify-between p-2 bg-green-100 rounded-lg">
                  <span className="text-sm text-white/90">
                    {documentFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentFile(null);
                      if (documentInputRef.current) {
                        documentInputRef.current.value = "";
                      }
                    }}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
    </>
  );
};
