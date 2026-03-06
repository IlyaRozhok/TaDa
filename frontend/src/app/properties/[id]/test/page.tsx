"use client";

import React from "react";
import { usePropertyDetail } from "../../../hooks/usePropertyDetail";
import PropertyHeader from "../../../components/property/PropertyHeader";
import PropertyHero from "../../../components/property/PropertyHero";
import PropertyDetails from "../../../components/property/PropertyDetails";
import PropertyAmenities from "../../../components/property/PropertyAmenities";
import PropertyLocation from "../../../components/property/PropertyLocation";
import PropertyCTA from "../../../components/property/PropertyCTA";
import AuthModal from "../../../components/AuthModal";
import PropertyDetailSkeleton from "../../../components/ui/PropertyDetailSkeleton";
import { PropertyPriceCard } from "@/entities/property/ui/PropertyPriceCard";

export default function TestPropertyDetailPage() {
  const { state, allImages, publishDate, setAuthModalOpen, retryLoad } =
    usePropertyDetail();

  if (state.loading) {
    return <PropertyDetailSkeleton />;
  }

  if (state.error || !state.property) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              Failed to Load Property - TEST PAGE
            </h3>
            <p className="text-red-600 mb-8">
              {state.error || "Property not found"}
            </p>
            <button
              onClick={retryLoad}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PropertyHeader
        property={state.property}
        publishDate={publishDate}
        onSignUpClick={() => setAuthModalOpen(true)}
      />

      {/* Two parallel scrolling containers - NO STICKY */}
      <div className="lg:flex">
        {/* Left container - all main content */}
        <div className="lg:flex-1 lg:pr-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <PropertyHero
              property={state.property}
              allImages={allImages}
              onGalleryClick={() => setAuthModalOpen(true)}
            />

            {/* Thumbnails */}
            {allImages.length > 0 && state.property && (
              <section className="mt-4">
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {allImages.slice(0, 8).map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`${
                        state.property?.title || "Property"
                      } ${idx + 1}`}
                      className="h-28 w-44 object-cover rounded-xl border"
                    />
                  ))}
                </div>
              </section>
            )}

            <PropertyDetails property={state.property} />

            {/* About */}
            <section className="py-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                About appartment
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {state.property.description || "No description provided."}
              </p>
            </section>

            <PropertyAmenities property={state.property} />
            <PropertyLocation property={state.property} />

            {/* Notes / Rules */}
            <section className="py-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                * Примечания
              </h3>
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-700 leading-relaxed">
                <p className="mb-3">
                  При регистрации заезда необходимо предъявить действительное
                  удостоверение личности с фотографией и банковскую карту.
                  Обработка выполнения особых пожеланий не гарантирована и может
                  потребовать дополнительной оплаты.
                </p>
                <p className="mb-3">
                  Пожалуйста, заранее сообщите предполагаемое время прибытия. Вы
                  можете использовать поле «Особые пожелания» при бронировании
                  или связаться с объектом размещения напрямую — контактные
                  данные указаны в вашем подтверждении бронирования.
                </p>
                <p>
                  В этом объекте нельзя устраивать вечеринки и другие подобные
                  мероприятия.
                </p>
              </div>
            </section>

            <PropertyCTA />

            {/* Extra content to demonstrate parallel scrolling */}
            <section className="py-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Other options from your preferences
              </h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-2">
                      Similar Property {item}
                    </h4>
                    <p className="text-gray-600">
                      This is a similar property that matches your preferences.
                      It has great amenities and is located in a convenient area.
                      The right booking card should scroll parallel to this content.
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* More content to make page longer and test scrolling */}
            <section className="py-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Additional Information - Test Scrolling
              </h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-2">
                      Information Block {item}
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                      The right booking card should continue scrolling with this content.
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Feature one - testing parallel scroll</li>
                      <li>Feature two - right card should be visible</li>
                      <li>Feature three - all the way to the bottom</li>
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Final section to test bottom scrolling */}
            <section className="py-8 pb-16">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Final Section - Bottom of Page
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
                <p className="text-blue-800 font-semibold">
                  🎉 This is the bottom of the page! The right booking card should be visible here too.
                </p>
                <p className="text-blue-600 mt-2">
                  If you can see the booking card when this section is visible, 
                  then the parallel scrolling is working correctly!
                </p>
              </div>
            </section>

            {/* Mobile right column */}
            <div className="lg:hidden mt-6">
              <PropertyPriceCard property={state.property} />
            </div>
          </div>
        </div>

        {/* Right container - booking card (desktop only, scrolls parallel to left) */}
        <div className="hidden lg:block w-80 flex-shrink-0 p-4">
          <PropertyPriceCard property={state.property} />
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={state.authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}