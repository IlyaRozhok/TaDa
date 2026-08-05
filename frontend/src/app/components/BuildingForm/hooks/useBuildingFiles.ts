import { useEffect, useRef, useState } from "react";
import { buildingsAPI } from "@/app/lib/api";
import type { BuildingUploadResult } from "../types";

export const useBuildingFiles = () => {
  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  // Preview URLs
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);

  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Generate preview URLs for logo
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLogoPreview(null);
    }
  }, [logoFile]);

  // Generate preview URLs for video
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoPreview(null);
    }
  }, [videoFile]);

  // Generate preview URLs for photos
  useEffect(() => {
    const urls = photoFiles.map((file) => {
      try {
        return URL.createObjectURL(file);
      } catch (error) {
        console.error("Error creating preview URL:", error);
        return "";
      }
    });
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photoFiles]);

  // Generate preview URLs for documents (PDF thumbnails)
  useEffect(() => {
    const urls = documentFiles.map((file) => URL.createObjectURL(file));
    setDocumentPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [documentFiles]);

  const uploadAllFiles = async (): Promise<BuildingUploadResult> => {
    const uploadPromises = [];
    const errors: string[] = [];
    const uploadedUrls = {
      logo: "",
      video: "",
      photos: [] as string[],
      documents: "",
    };

    // Upload logo if selected
    if (logoFile) {
      uploadPromises.push(
        buildingsAPI
          .uploadLogo(logoFile)
          .then((result: { url: string; key: string }) => {
            uploadedUrls.logo = result.url;
            console.log("✅ Logo uploaded successfully");
          })
          .catch((error: any) => {
            console.error("❌ Logo upload failed:", error);
            errors.push("Logo upload failed");
          }),
      );
    }

    // Upload video if selected
    if (videoFile) {
      uploadPromises.push(
        (async () => {
          try {
            // Validate video file before upload
            const allowedVideoTypes = [
              "video/mp4",
              "video/mpeg",
              "video/quicktime",
              "video/x-msvideo",
              "video/x-ms-wmv",
            ];

            if (!allowedVideoTypes.includes(videoFile.type)) {
              throw new Error(
                `Неподдерживаемый формат видео. Разрешены: MP4, MPEG, MOV, AVI, WMV. Ваш файл: ${videoFile.type || "неизвестный формат"}`,
              );
            }

            // Check file size (max 500MB)
            const maxSize = 500 * 1024 * 1024; // 500MB
            if (videoFile.size > maxSize) {
              const sizeMB = (videoFile.size / (1024 * 1024)).toFixed(2);
              throw new Error(
                `Файл слишком большой (${sizeMB} MB). Максимальный размер: 500 MB`,
              );
            }

            console.log("📹 Загрузка видео:", {
              name: videoFile.name,
              type: videoFile.type,
              size: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
            });

            const result = await buildingsAPI.uploadVideo(videoFile);

            if (!result || !result.url) {
              throw new Error("Сервер не вернул URL загруженного видео");
            }

            uploadedUrls.video = result.url;
            console.log("✅ Видео успешно загружено:", uploadedUrls.video);
          } catch (error: any) {
            console.error("❌ Ошибка загрузки видео:", error);
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              "Ошибка загрузки видео";
            errors.push(errorMessage);
            throw error;
          }
        })(),
      );
    }

    // Upload photos if selected
    if (photoFiles.length > 0) {
      uploadPromises.push(
        buildingsAPI
          .uploadPhotos(photoFiles)
          .then((results: { url: string; key: string }[]) => {
            uploadedUrls.photos = results.map((r) => r.url);
            console.log(`✅ ${results.length} photos uploaded successfully`);
          })
          .catch((error: any) => {
            console.error("❌ Photos upload failed:", error);
            errors.push("Photos upload failed");
          }),
      );
    }

    // Upload documents if selected
    if (documentFiles.length > 0) {
      uploadPromises.push(
        buildingsAPI
          .uploadDocuments(documentFiles)
          .then((results: { url: string; key: string }[]) => {
            if (results && results.length > 0) {
              uploadedUrls.documents = results[0].url;
            }
            console.log(`✅ ${results.length} documents uploaded successfully`);
          })
          .catch((error: any) => {
            console.error("❌ Documents upload failed:", error);
            errors.push("Documents upload failed");
          }),
      );
    }

    if (uploadPromises.length > 0) {
      await Promise.allSettled(uploadPromises);

      // Errors are logged to console
      if (errors.length > 0) {
        console.error(`Some uploads failed: ${errors.join("; ")}`);
      }
    }

    return {
      uploadedUrls,
      hasErrors: errors.length > 0,
    };
  };

  const resetFiles = () => {
    // Reset file states
    setLogoFile(null);
    setVideoFile(null);
    setPhotoFiles([]);
    setDocumentFiles([]);

    // Reset preview states
    setLogoPreview(null);
    setVideoPreview(null);
    setPhotoPreviews([]);
    setDocumentPreviews([]);
  };

  return {
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
    uploadAllFiles,
    resetFiles,
  };
};
