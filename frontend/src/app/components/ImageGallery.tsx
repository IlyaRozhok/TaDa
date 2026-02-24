"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { memo } from "react";
import Image from "next/image";

import { PropertyMedia } from "../types";
import { PROPERTY_PLACEHOLDER } from "../utils/placeholders";

interface ImageGalleryProps {
  images?: string[]; // Deprecated: for backward compatibility
  media?: PropertyMedia[]; // New: S3 media files
  alt: string;
}

const ImageGallery = memo(function ImageGallery({
  images,
  media,
  alt,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use media URLs if available, otherwise fallback to images, then placeholder
  const getDisplayImages = (): string[] => {
    if (media && media.length > 0) {
      // Sort by order_index and filter only images, then extract URLs
      const mediaUrls = media
        .filter((item) => item.type === "image" || !item.type)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map((item) => item.url)
        .filter(Boolean);

      if (mediaUrls.length > 0) {
        return mediaUrls;
      }
    }

    if (images && images.length > 0) {
      return images;
    }

    // Return placeholder only if no real images
    return [PROPERTY_PLACEHOLDER];
  };

  const displayImages = getDisplayImages();

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setSelectedImage(
      (prev) => (prev - 1 + displayImages.length) % displayImages.length,
    );
  };

  // Keyboard navigation for fullscreen modal
  React.useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      } else if (e.key === "ArrowLeft") {
        setSelectedImage(
          (prev) => (prev - 1 + displayImages.length) % displayImages.length,
        );
      } else if (e.key === "ArrowRight") {
        setSelectedImage((prev) => (prev + 1) % displayImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, displayImages.length]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Для next/image ошибки обрабатываются автоматически через unoptimized fallback
    // Если нужно, можно добавить состояние для отображения placeholder
    console.error("Image failed to load:", displayImages[selectedImage]);
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Main Image */}
      <div className="relative">
        <div
          className="bg-gray-200 rounded-lg sm:rounded-xl overflow-hidden cursor-pointer h-80 sm:h-96 md:h-[500px] lg:h-[600px] w-full relative group"
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src={displayImages[selectedImage]}
            alt={`${alt} - Image ${selectedImage + 1}`}
            fill
            sizes="100vw"
            className="object-cover w-full h-full transition-transform duration-500"
            onError={handleImageError}
            loading="lazy"
            quality={90}
          />

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-black/70 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-3lg sm:rounded-3xl text-xs sm:text-sm font-medium shadow-lg">
              {selectedImage + 1} / {displayImages.length}
            </div>
          )}

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2 sm:p-2.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2 sm:p-2.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Click to expand hint */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-3lg sm:rounded-3xl text-xs sm:text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Click to view fullscreen
          </div>
        </div>
      </div>

      {/* Thumbnail Grid - Much Smaller */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 sm:gap-1.5">
          {displayImages.slice(0, 8).map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`bg-gray-200 rounded overflow-hidden border transition-all relative group h-12 sm:h-14 md:h-16 w-full ${
                selectedImage === index
                  ? "border-black ring-1 ring-black/30"
                  : "border-gray-300 hover:border-gray-500"
              }`}
            >
              <Image
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
                fill
                sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
                className="object-cover transition-transform duration-300"
                onError={handleImageError}
                loading="lazy"
              />
              {selectedImage === index && (
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
              )}
            </button>
          ))}
          {displayImages.length > 8 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-100 rounded overflow-hidden border border-gray-300 hover:border-gray-500 transition-all relative group flex items-center justify-center h-12 sm:h-14 md:h-16 w-full"
            >
              <div className="text-center">
                <div className="text-[10px] sm:text-xs font-bold text-gray-700">
                  +{displayImages.length - 8}
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Full Screen Modal - Liquid Glass Style */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
          style={{
            background:
              "linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div
            className="relative w-full h-full max-w-7xl max-h-screen p-4 sm:p-6 lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Liquid Glass */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 text-white rounded-full p-2.5 sm:p-3 transition-all duration-200 shadow-xl"
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px) saturate(180%)",
                WebkitBackdropFilter: "blur(10px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.4)";
              }}
              aria-label="Close gallery"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Modal Image Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="relative w-full h-full max-h-[90vh] max-w-7xl">
                <Image
                  src={displayImages[selectedImage]}
                  alt={`${alt} - Full size ${selectedImage + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  onError={handleImageError}
                  priority
                  quality={95}
                />
              </div>
            </div>

            {/* Modal Navigation */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 text-white rounded-full p-3 sm:p-4 transition-all duration-200 shadow-xl"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px) saturate(180%)",
                    WebkitBackdropFilter: "blur(10px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
                    e.currentTarget.style.transform =
                      "translateY(-50%) scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.4)";
                    e.currentTarget.style.transform =
                      "translateY(-50%) scale(1)";
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 text-white rounded-full p-3 sm:p-4 transition-all duration-200 shadow-xl"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px) saturate(180%)",
                    WebkitBackdropFilter: "blur(10px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
                    e.currentTarget.style.transform =
                      "translateY(-50%) scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.4)";
                    e.currentTarget.style.transform =
                      "translateY(-50%) scale(1)";
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>

                {/* Modal Image Counter - Liquid Glass */}
                <div
                  className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium shadow-xl"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px) saturate(180%)",
                    WebkitBackdropFilter: "blur(10px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {selectedImage + 1} / {displayImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ImageGallery;
