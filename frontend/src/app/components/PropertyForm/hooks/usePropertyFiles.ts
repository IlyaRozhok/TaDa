import { useState, useEffect, useRef } from "react";

export const usePropertyFiles = () => {
  // File states
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Preview URLs
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  // Refs for file inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Photo previews
  useEffect(() => {
    const previews = photoFiles.map(file => URL.createObjectURL(file));
    setPhotoPreviews(previews);

    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoFiles]);

  // Video preview
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoPreview(null);
    }
  }, [videoFile]);

  // Document preview
  useEffect(() => {
    if (documentFile) {
      const url = URL.createObjectURL(documentFile);
      setDocumentPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setDocumentPreview(null);
    }
  }, [documentFile]);

  const handlePhotoUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setPhotoFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (file: File | null) => {
    setVideoFile(file);
  };

  const handleDocumentUpload = (file: File | null) => {
    setDocumentFile(file);
  };

  const resetFiles = () => {
    setPhotoFiles([]);
    setVideoFile(null);
    setDocumentFile(null);
  };

  return {
    // Files
    photoFiles,
    videoFile,
    documentFile,
    // Previews
    photoPreviews,
    videoPreview,
    documentPreview,
    // Refs
    photoInputRef,
    videoInputRef,
    documentInputRef,
    // Handlers
    handlePhotoUpload,
    removePhoto,
    handleVideoUpload,
    handleDocumentUpload,
    resetFiles,
  };
};