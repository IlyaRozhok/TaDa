"use client";

import React from "react";
import Link from "next/link";
import { Button } from "./ui/Button";
import { Sparkles, Building, MapPin, Star } from "lucide-react";

export default function SimpleFeaturedSection() {
  return (
    <section className="py-12 px-4 bg-gray-50 sm:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto">
        {/* Mobile-First Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 bg-white rounded-full shadow-sm mb-3 sm:mb-4">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Featured Properties & Developments
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
            Discover Premium Living
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed">
            Explore handpicked properties and exclusive residential developments
            in London&apos;s most desirable locations.
          </p>
        </div>

        {/* Mobile-Optimized Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {/* Card 1 - Residential Complex */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
            {/* Mobile-Friendly Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
              <div className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">New Development</span>
                <span className="sm:hidden">New</span>
              </div>
            </div>

            {/* Mobile-Optimized Image */}
            <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&crop=edges"
                alt="The Landmark Pinnacle"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>

            {/* Mobile-First Content */}
            <div className="p-4 sm:p-6">
              {/* Mobile Header */}
              <div className="flex items-start gap-3 mb-3 sm:mb-4">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors leading-tight">
                    The Landmark Pinnacle
                  </h3>
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Canary Wharf, London</span>
                  </div>
                </div>
              </div>

              {/* Mobile Description */}
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                London&apos;s tallest residential tower offering luxury living
                with breathtaking views across the city.
              </p>

              {/* Mobile Metadata */}
              <div className="mb-4 sm:mb-6">
                <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  From £500k
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    Gym
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    Spa
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    Concierge
                  </span>
                </div>
              </div>

              {/* Mobile-First Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Link href="/properties" className="flex-1">
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm sm:text-base"
                    size="sm"
                  >
                    Learn More
                  </Button>
                </Link>
                <Link href="/properties">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 text-sm sm:text-base"
                  >
                    View Properties
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2 - Property */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
            {/* Mobile-Friendly Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
              <div className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                <Star className="w-3 h-3" />
                <span>Featured</span>
              </div>
            </div>

            {/* Mobile-Optimized Image */}
            <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&crop=edges"
                alt="Luxury 2-Bed Apartment"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>

            {/* Mobile-First Content */}
            <div className="p-4 sm:p-6">
              {/* Mobile Header */}
              <div className="flex items-start gap-3 mb-3 sm:mb-4">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors leading-tight">
                    Luxury 2-Bed Apartment
                  </h3>
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Shoreditch, London</span>
                  </div>
                </div>
              </div>

              {/* Mobile Description */}
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Beautiful modern apartment in the heart of trendy Shoreditch
                with excellent transport links.
              </p>

              {/* Mobile Metadata */}
              <div className="mb-4 sm:mb-6">
                <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  £850,000
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    2 bed
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    2 bath
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    apartment
                  </span>
                </div>
              </div>

              {/* Mobile-First Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Link href="/properties" className="flex-1">
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm sm:text-base"
                    size="sm"
                  >
                    View Details
                  </Button>
                </Link>
                <Link href="/app/auth/register">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Save Property
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3 - Info - Desktop Only on XL screens, Always Visible on Mobile/Tablet */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 lg:col-span-2 xl:col-span-1">
            {/* Mobile-Friendly Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
              <div className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 rounded-full text-xs font-medium border bg-purple-100 text-purple-800 border-purple-200">
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Smart Matching</span>
                <span className="sm:hidden">AI Match</span>
              </div>
            </div>

            {/* Mobile-Optimized Image */}
            <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&crop=edges"
                alt="AI Matching"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>

            {/* Mobile-First Content */}
            <div className="p-4 sm:p-6">
              {/* Mobile Header */}
              <div className="flex items-start gap-3 mb-3 sm:mb-4">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors leading-tight">
                    Discover Your Perfect Match
                  </h3>
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      AI-Powered Property Matching
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Description */}
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Our smart matching algorithm learns your preferences and
                lifestyle to suggest properties that truly fit your needs.
              </p>

              {/* Mobile Metadata */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    AI Matching
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    Lifestyle Quiz
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    Personalized
                  </span>
                </div>
              </div>

              {/* Mobile-First Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Link href="/app/preferences" className="flex-1">
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm sm:text-base"
                    size="sm"
                  >
                    Take Lifestyle Quiz
                  </Button>
                </Link>
                <Link href="/properties">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Call to Action */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Ready to find your perfect home? Explore all our properties or get
            personalized matches.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-center">
            <Link href="/properties" className="sm:inline-block">
              <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 sm:px-8 py-3 text-sm sm:text-base">
                Browse All Properties
              </Button>
            </Link>
            <Link href="/app/preferences" className="sm:inline-block">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 px-6 sm:px-8 py-3 text-sm sm:text-base"
              >
                Take Lifestyle Quiz
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
