import React, { useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Upload, GripVertical } from "lucide-react";
import type { Building as ApiBuilding } from "@/store/api/buildings.api";
import type { BuildingFormData } from "../types";

interface EditMediaSectionProps {
  building: ApiBuilding;
  formData: BuildingFormData;
  setFormData: Dispatch<SetStateAction<BuildingFormData>>;
  logoFile: File | null;
  setLogoFile: Dispatch<SetStateAction<File | null>>;
  videoFile: File | null;
  setVideoFile: Dispatch<SetStateAction<File | null>>;
  photoFiles: File[];
  setPhotoFiles: Dispatch<SetStateAction<File[]>>;
  documentFiles: File[];
  setDocumentFiles: Dispatch<SetStateAction<File[]>>;
  logoPreview: string | null;
  videoPreview: string | null;
  photoPreviews: string[];
  setPhotoPreviews: Dispatch<SetStateAction<string[]>>;
  documentPreviews: string[];
  removedPhotos: string[];
  setRemovedPhotos: Dispatch<SetStateAction<string[]>>;
  removedLogo: boolean;
  setRemovedLogo: Dispatch<SetStateAction<boolean>>;
  removedVideo: boolean;
  setRemovedVideo: Dispatch<SetStateAction<boolean>>;
  removedDocuments: boolean;
  setRemovedDocuments: Dispatch<SetStateAction<boolean>>;
  photoInputRef: RefObject<HTMLInputElement | null>;
}

/**
 * Edit-mode media block, moved verbatim from the monolith: alongside the
 * upload inputs it renders the building's existing media with per-item
 * removal tracking and drag-reorder over both the new files and the
 * existing photo URLs.
 */
export const EditMediaSection: React.FC<EditMediaSectionProps> = ({
  building,
  formData,
  setFormData,
  logoFile,
  setLogoFile,
  videoFile,
  setVideoFile,
  photoFiles,
  setPhotoFiles,
  documentFiles,
  setDocumentFiles,
  logoPreview,
  videoPreview,
  photoPreviews,
  setPhotoPreviews,
  documentPreviews,
  removedPhotos,
  setRemovedPhotos,
  removedLogo,
  setRemovedLogo,
  removedVideo,
  setRemovedVideo,
  removedDocuments,
  setRemovedDocuments,
  photoInputRef,
}) => {
  // Drag and drop state for photos
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(
    null,
  );
  const [draggedPhotoFileIndex, setDraggedPhotoFileIndex] = useState<
    number | null
  >(null);

  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
        Media Files
      </h4>

      <div className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Logo (Image File)
          </label>
          <div className="space-y-2">
            <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setLogoFile(file);
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-white/70 mb-2" />
                <p className="text-sm text-white/90 font-medium">
                  Click to upload logo
                </p>
                <p className="text-xs text-white/60 mt-1">PNG, JPG</p>
              </div>
            </label>
            {logoFile && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg">
                  <Upload className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/90 flex-1">
                    {logoFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLogoFile(null)}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20"
                  >
                    Remove
                  </button>
                </div>
                {logoPreview && (
                  <div className="mt-2">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-w-xs max-h-32 object-contain border border-white/20 rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}
            {building.logo && !logoFile && !removedLogo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg">
                  <span className="text-sm text-white/90 font-medium">
                    Current logo:
                  </span>
                  <button
                    type="button"
                    onClick={() => setRemovedLogo(true)}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20 ml-auto"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2">
                  <img
                    src={building.logo}
                    alt="Current logo"
                    className="max-w-xs max-h-32 object-contain border border-white/20 rounded-lg"
                    onError={(e) => {
                      console.error("Failed to load current logo");
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
            {removedLogo && (
              <div className="text-sm text-white/60 italic">
                Logo will be removed on save
              </div>
            )}
          </div>
        </div>

        {/* Video Upload */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Video (Video File)
          </label>
          <div className="space-y-2">
            <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setVideoFile(file);
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
            {videoFile && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg">
                  <Upload className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/90 flex-1">
                    {videoFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20"
                  >
                    Remove
                  </button>
                </div>
                {videoPreview && (
                  <div className="mt-2">
                    <video
                      src={videoPreview}
                      controls
                      className="max-w-md max-h-64 border border-white/20 rounded-lg"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>
            )}
            {building.video && !videoFile && !removedVideo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg">
                  <span className="text-sm text-white/90 font-medium">
                    Current video:
                  </span>
                  <button
                    type="button"
                    onClick={() => setRemovedVideo(true)}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20 ml-auto"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2">
                  <video
                    src={building.video}
                    controls
                    className="max-w-md max-h-64 border border-white/20 rounded-lg"
                    onError={(e) => {
                      console.error("Failed to load current video");
                      e.currentTarget.style.display = "none";
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}
            {removedVideo && (
              <div className="text-sm text-white/60 italic">
                Video will be removed on save
              </div>
            )}
          </div>
        </div>

        {/* Photos Upload */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Photos (Image Files)
          </label>
          <div className="space-y-2">
            <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  if (newFiles.length > 0) {
                    setPhotoFiles((prev) => [...prev, ...newFiles]);
                    // Reset input so user can select the same file again if needed
                    if (photoInputRef.current) {
                      photoInputRef.current.value = "";
                    }
                  }
                }}
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
            {photoFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg mb-3">
                  <Upload className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/90 flex-1">
                    {photoFiles.length} photo
                    {photoFiles.length > 1 ? "s" : ""} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhotoFiles([])}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                  {photoFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}-${file.size}`}
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
                      className={`relative border border-white/20 rounded-lg overflow-hidden group bg-white/5 cursor-move transition-all ${
                        draggedPhotoFileIndex === index
                          ? "opacity-50 scale-95"
                          : ""
                      }`}
                    >
                      <div className="relative w-full h-32 bg-white/5">
                        {photoPreviews[index] ? (
                          <img
                            src={photoPreviews[index]}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(
                                "Failed to load image preview",
                              );
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40">
                            <Upload className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2">
                            <div className="p-1 bg-white/20 rounded-full">
                              <GripVertical className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="absolute top-2 right-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPhotoFiles((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                              className="px-2 py-1 bg-red-500/90 text-white text-xs rounded hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-white/5">
                        <p className="text-xs text-white/70 truncate">
                          {file.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(() => {
              // Use formData.photos for display to reflect reordering
              const displayPhotos = (formData.photos || []).filter(
                (p) => !removedPhotos.includes(p),
              );

              if (
                displayPhotos.length === 0 &&
                (!building.photos || building.photos.length === 0)
              ) {
                return null;
              }

              return (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">
                      Current photos: {displayPhotos.length} photo
                      {displayPhotos.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-white/60">
                      Drag to reorder
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                    {displayPhotos.map((photoUrl, index) => (
                      <div
                        key={`existing-photo-${photoUrl}-${index}`}
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
                        className={`relative border border-white/20 rounded-lg overflow-hidden group bg-white/5 cursor-move transition-all ${
                          draggedPhotoIndex === index
                            ? "opacity-50 scale-95"
                            : ""
                        }`}
                      >
                        <div className="relative w-full h-32 bg-white/5">
                          <img
                            src={photoUrl}
                            alt={`Current photo ${index + 1}`}
                            className="w-full h-full object-cover"
                            draggable={false}
                            onError={(e) => {
                              console.error(
                                "Failed to load current photo",
                              );
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2">
                              <div className="p-1 bg-white/20 rounded-full">
                                <GripVertical className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="absolute top-2 right-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setRemovedPhotos((prev) => [
                                    ...prev,
                                    photoUrl,
                                  ]);
                                }}
                                className="px-2 py-1 bg-red-500/90 text-white text-xs rounded hover:bg-red-600 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-2 bg-white/5">
                          <p className="text-xs text-white/70 truncate">
                            Photo {index + 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {removedPhotos.length > 0 && (
                    <div className="text-sm text-white/60 italic">
                      {removedPhotos.length} photo
                      {removedPhotos.length > 1 ? "s" : ""} marked for
                      removal
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Documents Upload */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Documents (PDF Files)
          </label>
          <div className="space-y-2">
            <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setDocumentFiles(files);
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-white/70 mb-2" />
                <p className="text-sm text-white/90 font-medium">
                  Click to upload documents
                </p>
                <p className="text-xs text-white/60 mt-1">
                  PDF files - Multiple files allowed
                </p>
              </div>
            </label>
            {documentFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg mb-3">
                  <Upload className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/90 flex-1">
                    {documentFiles.length} PDF file
                    {documentFiles.length > 1 ? "s" : ""} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setDocumentFiles([])}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors border border-white/20"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                  {documentFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative border border-white/20 rounded-lg overflow-hidden group bg-white/5"
                    >
                      <div className="flex flex-col items-center justify-center p-4 h-32">
                        <svg
                          className="w-12 h-12 text-white/50 mb-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-xs text-white/70 text-center truncate w-full px-2">
                          {file.name}
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentFiles((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                          className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-opacity border border-white/20"
                        >
                          Remove
                        </button>
                      </div>
                      {documentPreviews[index] && (
                        <iframe
                          src={documentPreviews[index]}
                          className="hidden"
                          title={`PDF preview ${index + 1}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {building.documents && !removedDocuments && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">
                    Current document:
                  </span>
                  <button
                    type="button"
                    onClick={() => setRemovedDocuments(true)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                  <div className="relative border border-gray-300 rounded-md overflow-hidden group bg-gray-50">
                    <div className="flex flex-col items-center justify-center p-4 h-32">
                      <svg
                        className="w-12 h-12 text-red-600 mb-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-xs text-gray-600 text-center truncate w-full px-2">
                        Current Document
                      </p>
                      <a
                        href={building.documents}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        View PDF
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {removedDocuments && (
              <div className="text-sm text-gray-500 italic">
                Document will be removed on save
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
