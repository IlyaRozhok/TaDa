"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { propertiesAPI, Property } from "../../lib/api";
import ImageGallery from "../../components/ImageGallery";
import LifestyleFeatures from "../../components/LifestyleFeatures";
import { Button } from "../../components/ui/Button";
import Logo from "../../components/Logo";
import AuthModal from "../../components/AuthModal";
import { ArrowLeft, MapPin, Calendar, Bed, Bath, Lock } from "lucide-react";
import PropertyMap from "../../components/PropertyMap";
import Link from "next/link";

export default function PublicPropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setError("Property ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const propertyData = await propertiesAPI.getByIdPublic(id as string);
        setProperty(propertyData);
      } catch (err: any) {
        console.error("Error fetching property:", err);
        setError(err.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const allImages: string[] = useMemo(() => {
    if (!property) return [];
    const mediaUrls = (property.media || [])
      .map((m: any) => m.url || m.s3_url)
      .filter(Boolean);
    const legacy = property.images || [];
    return [...mediaUrls, ...legacy];
  }, [property]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              Failed to Load Property
            </h3>
            <p className="text-red-600 mb-8">{error || "Property not found"}</p>
            <button
              onClick={() => router.push("/properties")}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Back to Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  const publishDate = new Date(
    // try common field names for created date
    (property as any).created_at || (property as any).createdAt || Date.now()
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top header with logo and sign up */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Logo size="sm" />
              </Link>
            </div>
            <nav className="flex items-center space-x-6">
              <Button
                size="sm"
                onClick={() => setAuthModalOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Sign Up
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Title + location + publish date */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {property.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{property.address}</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Publish date</span>
            <span className="font-medium text-gray-800">
              {publishDate.toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>
      </section>

      {/* Main hero: gallery + price card */}
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
                onClick={() => {
                  // open auth to see gallery if needed
                }}
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
                  <div className="text-sm text-gray-600 mb-2">
                    Available from
                  </div>
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

      {/* Thumbnails */}
      {allImages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {allImages.slice(0, 8).map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`${property.title} ${idx + 1}`}
                className="h-28 w-44 object-cover rounded-xl border"
              />
            ))}
          </div>
        </section>
      )}

      {/* Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Details</h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Property type</p>
            <p className="text-gray-900 font-semibold capitalize">
              {property.property_type || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Property type</p>
            <p className="text-gray-900 font-semibold capitalize">Apartment</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Furnishing</p>
            <p className="text-gray-900 font-semibold capitalize">
              {property.furnishing || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Bedrooms</p>
            <p className="text-gray-900 font-semibold flex items-center gap-2">
              <Bed className="w-4 h-4" /> {property.bedrooms ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Bathrooms</p>
            <p className="text-gray-900 font-semibold flex items-center gap-2">
              <Bath className="w-4 h-4" /> {property.bathrooms ?? "—"}
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          About appartment
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {property.description || "No description provided."}
        </p>
      </section>

      {/* Amenities */}
      {property.lifestyle_features &&
        property.lifestyle_features.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              What this place offers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.lifestyle_features
                .slice(0, 12)
                .map((feat: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <span className="w-5 h-5 rounded-sm border border-gray-300 inline-block"></span>
                    <span className="text-gray-800">{feat}</span>
                  </div>
                ))}
            </div>
            {property.lifestyle_features.length > 12 && (
              <button className="mt-4 px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50">
                See all offers ({property.lifestyle_features.length})
              </button>
            )}
          </section>
        )}

      {/* Location */}
      {property.address && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Appart location
          </h2>
          <p className="text-gray-600 mb-4">{property.address}</p>
          <div className="rounded-2xl overflow-hidden border">
            <PropertyMap
              address={property.address}
              title={property.title}
              height="h-[460px]"
              className="w-full"
            />
          </div>
        </section>
      )}

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
            связаться с объектом размещения напрямую — контактные данные указаны
            в вашем подтверждении бронирования.
          </p>
          <p>
            В этом объекте нельзя устраивать вечеринки и другие подобные
            мероприятия.
          </p>
        </div>
      </section>

      {/* CTA save/favourites */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Lock className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">
              Want to save this property?
            </h3>
          </div>
          <p className="text-gray-200 mb-4">
            Create a free account to save favorites, contact property operators,
            and get personalized matches
          </p>
          <div className="flex gap-3">
            <Link href="/app/auth/register">
              <Button className="bg-white text-gray-900 hover:bg-gray-100">
                Sign Up Free
              </Button>
            </Link>
            <Link href="/app/auth/login">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
