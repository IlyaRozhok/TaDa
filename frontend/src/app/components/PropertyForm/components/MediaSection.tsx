import React from "react";
import { Upload } from "lucide-react";

interface MediaSectionProps {
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  documentInputRef: React.RefObject<HTMLInputElement | null>;
  photoPreviews: string[];
  videoPreview: string | null;
  documentFile: File | null;
  onPhotoChange: (files: FileList | null) => void;
  onRemovePhoto: (index: number) => void;
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearVideo: () => void;
  onClearDocument: () => void;
}

export const MediaSection: React.FC<MediaSectionProps> = ({
  photoInputRef,
  videoInputRef,
  documentInputRef,
  photoPreviews,
  videoPreview,
  documentFile,
  onPhotoChange,
  onRemovePhoto,
  onVideoChange,
  onDocumentChange,
  onClearVideo,
  onClearDocument,
}) => {
  return (
    <div className="space-y-6">
      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Add Photos
        </label>
        <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onPhotoChange(e.target.files)}
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
              <div key={preview} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border-2 border-green-500"
                />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Add Video
        </label>
        <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={onVideoChange}
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
              onClick={onClearVideo}
              className="absolute top-1 right-1 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Documents */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Add Document
        </label>
        <label className="relative flex flex-col items-center justify-center w-full border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors p-6">
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf"
            onChange={onDocumentChange}
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
          <div className="mt-2 flex items-center justify-between p-2 bg-white/10 rounded-lg">
            <span className="text-sm text-white/90">{documentFile.name}</span>
            <button
              type="button"
              onClick={onClearDocument}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full border border-white/20"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
