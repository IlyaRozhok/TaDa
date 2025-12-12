"use client";

import React from "react";
import { Button } from "@/shared/ui/Button/Button";
import ImageGallery from "@/app/components/ImageGallery";
import { Calendar } from "lucide-react";
import { Property } from "@/app/types";

interface PropertyHeroProps {
  property: Property;
  allImages: string[];
  onGalleryClick?: () => void;
}

export default function PropertyHero({
  property,
  allImages,
  onGalleryClick,
}: PropertyHeroProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Gallery */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden">
          <div className="rounded-2xl overflow-hidden">
            <ImageGallery
              media={property.media}
              images={property.images}
              alt={property.title}
            />
          </div>
          {allImages.length > 0 && (
            <button
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 text-sm font-semibold rounded-full px-4 py-2 shadow-lg"
              onClick={onGalleryClick}
            >
              See all photo ({allImages.length})
            </button>
          )}
        </div>

        {/* Price/CTA card */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-baseline gap-2 mb-4">
                <div className="text-4xl font-bold text-gray-900">
                  £{property.price.toLocaleString()}
                </div>
                <div className="text-gray-500">Price per month</div>
              </div>
              <Button className="w-full h-12 rounded-full text-base">
                Book this appartment
              </Button>
              <p className="text-xs text-gray-500 mt-3">
                You won't be charged yet, only after reservation and approve
                your form
              </p>
              <div className="mt-6 border-t pt-4">
                <div className="text-sm text-gray-600 mb-2">Available from</div>
                <div className="flex items-center text-gray-900 font-medium">
                  <Calendar className="w-4 h-4 mr-2" />
                  {property.available_from
                    ? new Date(property.available_from).toLocaleDateString(
                        "en-GB"
                      )
                    : "To be confirmed"}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
