"use client";

import React, { useState, useEffect } from "react";
import { featuredAPI } from "../lib/api";
import { HomeCard } from "../types/featured";
import FeaturedCard from "./FeaturedCard";
import { Sparkles, TrendingUp } from "lucide-react";

// Mock data fallback for when API is not available
const getMockCards = (): HomeCard[] => {
  return [
    {
      id: 'mock-complex-1',
      type: 'residential-complex',
      title: 'The Landmark Pinnacle',
      subtitle: 'Canary Wharf, London',
      description: "London's tallest residential tower offering luxury living with breathtaking views across the city.",
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&crop=edges',
      primaryAction: {
        text: 'Learn More',
        url: '/properties'
      },
      secondaryAction: {
        text: 'View Properties',
        url: '/properties'
      },
      badge: { text: 'New Development', variant: 'new' },
      metadata: {
        price: 'From £500k',
        location: 'Canary Wharf, London',
        features: ['Gym', 'Spa', 'Concierge']
      }
    },
    {
      id: 'mock-property-1',
      type: 'property',
      title: 'Luxury 2-Bed Apartment',
      subtitle: 'Shoreditch, London',
      description: 'Beautiful modern apartment in the heart of trendy Shoreditch with excellent transport links.',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&crop=edges',
      primaryAction: {
        text: 'View Details',
        url: '/properties'
      },
      secondaryAction: {
        text: 'Save Property',
        url: '/app/auth/register'
      },
      badge: { text: 'Featured', variant: 'featured' },
      metadata: {
        price: '£850,000',
        location: 'Shoreditch, London',
        features: ['2 bed', '2 bath', 'apartment']
      }
    },
    {
      id: 'mock-complex-2',
      type: 'residential-complex',
      title: 'One Thames City',
      subtitle: 'Nine Elms, London',
      description: 'A stunning riverside development featuring contemporary apartments with panoramic Thames views.',
      imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=edges',
      primaryAction: {
        text: 'Learn More',
        url: '/properties'
      },
      secondaryAction: {
        text: 'View Properties',
        url: '/properties'
      },
      metadata: {
        price: 'From £650k',
        location: 'Nine Elms, London',
        features: ['Swimming Pool', 'Gym', 'Concierge']
      }
    },
    {
      id: 'mock-property-2',
      type: 'property',
      title: 'Modern Studio Flat',
      subtitle: 'King\'s Cross, London',
      description: 'Stylish studio apartment perfect for professionals, located minutes from King\'s Cross Station.',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&crop=edges',
      primaryAction: {
        text: 'View Details',
        url: '/properties'
      },
      secondaryAction: {
        text: 'Save Property',
        url: '/app/auth/register'
      },
      metadata: {
        price: '£425,000',
        location: 'King\'s Cross, London',
        features: ['Studio', '1 bath', 'apartment']
      }
    },
    {
      id: 'mock-info-1',
      type: 'info',
      title: 'Discover Your Perfect Match',
      subtitle: 'AI-Powered Property Matching',
      description: 'Our smart matching algorithm learns your preferences and lifestyle to suggest properties that truly fit your needs.',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&crop=edges',
      primaryAction: {
        text: 'Take Lifestyle Quiz',
        url: '/app/preferences'
      },
      secondaryAction: {
        text: 'Learn How It Works',
        url: '/properties'
      },
      badge: { text: 'Smart Matching', variant: 'popular' },
      metadata: {
        features: ['AI Matching', 'Lifestyle Quiz', 'Personalized Results']
      }
    },
    {
      id: 'mock-complex-3',
      type: 'residential-complex',
      title: 'Aykon London One',
      subtitle: 'Vauxhall, London',
      description: 'An iconic tower offering premium residences in the heart of London\'s most dynamic district.',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&crop=edges',
      primaryAction: {
        text: 'Learn More',
        url: '/properties'
      },
      secondaryAction: {
        text: 'View Properties',
        url: '/properties'
      },
      metadata: {
        price: 'From £700k',
        location: 'Vauxhall, London',
        features: ['Infinity Pool', 'Spa', 'Sky Lounge']
      }
    }
  ];
};

export default function FeaturedSection() {
  const [cards, setCards] = useState<HomeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedCards = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔍 Fetching featured cards...");
        
        const featuredCards = await featuredAPI.getHomeCards();
        console.log("✅ Featured cards received:", featuredCards);
        setCards(featuredCards);
      } catch (err) {
        console.error("❌ Error fetching featured cards:", err);
        
        // Fallback to mock data if API fails
        console.log("🔄 Using fallback mock data...");
        const mockCards = getMockCards();
        setCards(mockCards);
        // Don't set error since we have fallback data
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCards();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Featured Properties & Developments
              </span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Premium Living
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore handpicked properties and exclusive residential
              developments in London&apos;s most desirable locations.
            </p>
          </div>

          {/* Loading Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="h-64 bg-gray-200 animate-pulse"></div>
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full mb-4">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">
              Unable to load featured content
            </span>
          </div>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </section>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Featured Properties & Developments
            </span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Premium Living
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore handpicked properties and exclusive residential developments
            in London&apos;s most desirable locations.
          </p>
        </div>

        {/* Featured Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card) => (
            <FeaturedCard key={card.id} card={card} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">
            Ready to find your perfect home? Explore all our properties or get
            personalized matches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/properties"
              className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Browse All Properties
            </a>
            <a
              href="/app/preferences"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Take Lifestyle Quiz
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
 