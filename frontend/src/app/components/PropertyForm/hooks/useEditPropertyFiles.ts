import { useEffect, useRef, useState } from "react";

/**
 * Edit-mode file handling, moved verbatim from the monolith: new-upload
 * file/preview state, the removed-existing-media flags, and the photo
 * handlers. Kept separate from the create form's `usePropertyFiles` on
 * purpose — the two implementations differ (appending photo input with a
 * ref reset, single document file, removal tracking).
 */
export const useEditPropertyFiles = () => {
  // File states for new uploads
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Preview URLs for new uploads
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  // Track removed existing media
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [removedVideo, setRemovedVideo] = useState(false);
  const [removedDocuments, setRemovedDocuments] = useState(false);

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Photo previews for new uploads
  useEffect(() => {
    if (photoFiles.length === 0) {
      setPhotoPreviews([]);
      return;
    }

    const objectUrls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoFiles]);

  // Video preview for new upload
  useEffect(() => {
    if (!videoFile) {
      setVideoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(videoFile);
    setVideoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [videoFile]);

  // Document preview for new upload
  useEffect(() => {
    if (!documentFile) {
      setDocumentPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(documentFile);
    setDocumentPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [documentFile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotoFiles((prev) => [...prev, ...newFiles]);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const removeNewPhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (photoUrl: string) => {
    setRemovedPhotos((prev) => [...prev, photoUrl]);
  };

  return {
    photoFiles,
    setPhotoFiles,
    videoFile,
    setVideoFile,
    documentFile,
    setDocumentFile,
    photoPreviews,
    setPhotoPreviews,
    videoPreview,
    documentPreview,
    removedPhotos,
    setRemovedPhotos,
    removedVideo,
    setRemovedVideo,
    removedDocuments,
    setRemovedDocuments,
    photoInputRef,
    videoInputRef,
    documentInputRef,
    handlePhotoChange,
    removeNewPhoto,
    removeExistingPhoto,
  };
};
