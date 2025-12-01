"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { usePropertyDetail } from "../../hooks/usePropertyDetail";
import PropertyHeader from "../../components/property/PropertyHeader";
import PropertyHero from "../../components/property/PropertyHero";
import PropertyDetails from "../../components/property/PropertyDetails";
import PropertyAmenities from "../../components/property/PropertyAmenities";
import PropertyLocation from "../../components/property/PropertyLocation";
import PropertyCTA from "../../components/property/PropertyCTA";
import AuthModal from "../../components/AuthModal";
import { LoadingPage } from "../../components/ui/LoadingSpinner";

export default function PublicPropertyDetailPage() {
  const router = useRouter();
  const { state, allImages, publishDate, setAuthModalOpen, retryLoad } =
    usePropertyDetail();

  if (state.loading) {
    return <LoadingPage text="Loading property details..." />;
  }

  if (state.error || !state.property) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              Failed to Load Property
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

        <PropertyHero
          property={state.property}
          allImages={allImages}
          onGalleryClick={() => setAuthModalOpen(true)}
        />

        {/* Thumbnails */}
        {allImages.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allImages.slice(0, 8).map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`${state.property.title} ${idx + 1}`}
                  className="h-28 w-44 object-cover rounded-xl border"
                />
              ))}
            </div>
          </section>
        )}

        <PropertyDetails property={state.property} />

        {/* About */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            * Примечания
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-700 leading-relaxed">
            <p className="mb-3">
              При регистрации заезда необходимо предъявить действительное
              удостоверение личности с фотографией и банковскую карту. Обработка
              выполнения особых пожеланий не гарантирована и может потребовать
              дополнительной оплаты.
            </p>
            <p className="mb-3">
              Пожалуйста, заранее сообщите предполагаемое время прибытия. Вы
              можете использовать поле «Особые пожелания» при бронировании или
              связаться с объектом размещения напрямую — контактные данные
              указаны в вашем подтверждении бронирования.
            </p>
            <p>
              В этом объекте нельзя устраивать вечеринки и другие подобные
              мероприятия.
            </p>
          </div>
        </section>

        <PropertyCTA />

        {/* Auth Modal */}
        <AuthModal
          isOpen={state.authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    </div>
  );
}
