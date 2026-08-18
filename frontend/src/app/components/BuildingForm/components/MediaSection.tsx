import React from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Upload } from "lucide-react";

interface MediaSectionProps {
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
  documentPreviews: string[];
  photoInputRef: RefObject<HTMLInputElement | null>;
}

export const MediaSection: React.FC<MediaSectionProps> = ({
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
  documentPreviews,
  photoInputRef,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
        Media Files (Optional)
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
                      key={`${file.name}-${index}`}
                      className="relative border border-white/20 rounded-lg overflow-hidden group bg-white/5"
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
                        <div className="absolute inset-0 group-hover:bg-black/50 transition-opacity flex items-center justify-center z-10">
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoFiles((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                            className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-opacity border border-white/20"
                          >
                            Remove
                          </button>
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
          </div>
        </div>
      </div>
    </div>
  );
};
