"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { propertiesAPI, Property } from "../../lib/api";
import ImageGallery from "../../components/ImageGallery";
import LifestyleFeatures from "../../components/LifestyleFeatures";
import { Button } from "../../components/ui/Button";
import Logo from "../../components/Logo";
import AuthModal from "../../components/AuthModal";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Home,
  Bed,
  Bath,
  Lock,
  Heart,
  DollarSign,
} from "lucide-react";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      <div className="min-h-screen bg-gray-50">
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
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

      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push("/properties")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Properties
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Gallery */}
          <div>
            <ImageGallery
              media={property.media}
              images={property.images}
              alt={property.title}
            />
          </div>

          {/* Right Column - Property Details */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.title}
              </h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{property.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-emerald-600">
                  £{property.price.toLocaleString()}/month
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Bed className="w-5 h-5" />
                    <span>{property.bedrooms} bed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-5 h-5" />
                    <span>{property.bathrooms} bath</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Type and Furnishing */}
            <div className="flex gap-4">
              <div className="flex-1 bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {property.property_type}
                </p>
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Furnishing</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {property.furnishing}
                </p>
              </div>
            </div>

            {/* Available From */}
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span>
                Available from{" "}
                {new Date(property.available_from).toLocaleDateString("en-UK", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                About this property
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Property Location Map */}
            {property.address && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Location
                </h2>
                <PropertyMap
                  address={property.address}
                  title={property.title}
                  height="h-64"
                  className="w-full"
                />
              </div>
            )}

            {/* Lifestyle Features */}
            {property.lifestyle_features &&
              property.lifestyle_features.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Amenities & Features
                  </h2>
                  <LifestyleFeatures features={property.lifestyle_features} />
                </div>
              )}

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Lock className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-semibold">
                  Want to save this property?
                </h3>
              </div>
              <p className="text-gray-200 mb-4">
                Create a free account to save favorites, contact property
                operators, and get personalized matches
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

            {/* Contact Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> You need an account to contact the
                property operator or schedule viewings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
