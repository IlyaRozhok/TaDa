"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { PropertyMedia } from "../types";
import { PROPERTY_PLACEHOLDER } from "../utils/placeholders";

interface ImageGalleryProps {
  images?: string[]; // Deprecated: for backward compatibility
  media?: PropertyMedia[]; // New: S3 media files
  alt: string;
}

export default function ImageGallery({
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
        .map((item) => item.url || item.s3_url)
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
      (prev) => (prev - 1 + displayImages.length) % displayImages.length
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTAwTDIwMCAxMjVMMjI1IDEwMEwyNTAgMTI1VjE2MEgxNTBWMTI1TDE3NSAxMDBaIiBmaWxsPSIjOUIxMDRGIi8+CjxjaXJjbGUgY3g9IjE4MCIgY3k9IjExMCIgcj0iOCIgZmlsbD0iIzlCMTA0RiIvPgo8L3N2Zz4K";
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative">
        <div
          className="bg-gray-200 rounded-lg overflow-hidden cursor-pointer h-96 w-full"
          onClick={() => setIsModalOpen(true)}
        >
          <img
            src={displayImages[selectedImage]}
            alt={`${alt} - Image ${selectedImage + 1}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
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
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail Grid */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <img
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </button>
          ))}
        </div>
      )}

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative max-w-6xl max-h-full p-4">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 z-10 hover:bg-opacity-70 transition-opacity"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Image */}
            <img
              src={displayImages[selectedImage]}
              alt={`${alt} - Full size ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={handleImageError}
            />

            {/* Modal Navigation */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-3 rounded-full hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-3 rounded-full hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Modal Image Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
                  {selectedImage + 1} / {displayImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
