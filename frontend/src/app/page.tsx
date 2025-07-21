"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "./store/slices/authSlice";
import PropertyGridWithLoader from "./components/PropertyGridWithLoader";
import { Button } from "./components/ui/Button";
import Logo from "./components/Logo";
import AuthModal from "./components/AuthModal";
import { useProperties } from "./hooks/useProperties";
import { useDebounce } from "./hooks/useDebounce";
import { Property } from "./types";
import {
  Search,
  ArrowRight,
  Heart,
  MapPin,
  Sparkles,
  Shield,
  Zap,
  Users,
  X,
  Menu,
} from "lucide-react";

function HomeContent() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
  const searchParams = useSearchParams();

  // UI State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Properties State
  const { properties, loading, error, searchLoading, fetchPublicProperties } =
    useProperties();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Auto-redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      import("./utils/simpleRedirect").then(({ redirectAfterLogin }) => {
        redirectAfterLogin(user, router);
      });
    }
  }, [isAuthenticated, user, router]);

  // Handle role selection from OAuth
  useEffect(() => {
    const needsRole = searchParams.get("needsRole");
    if (needsRole === "true") {
      setNeedsRoleSelection(true);
      setAuthModalOpen(true);
      router.replace("/", undefined);
    }
  }, [searchParams, router]);

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        await fetchPublicProperties(1, 6, debouncedSearchTerm);
      } catch (err: unknown) {
        console.error("Error fetching properties:", err);
      }
    };
    loadProperties();
  }, [debouncedSearchTerm, fetchPublicProperties]);

  const handlePropertyClick = (property: Property) => {
    router.push(`/properties/${property.id}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Show loading for authenticated users
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Matching",
      description:
        "Smart algorithm matches you with properties that fit your lifestyle",
    },
    {
      icon: MapPin,
      title: "Prime Locations",
      description:
        "Curated properties in London's most desirable neighborhoods",
    },
    {
      icon: Shield,
      title: "Verified Properties",
      description:
        "All listings verified by our expert team for quality assurance",
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "Start browsing immediately - no registration required",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="sm" />
              <span className="ml-2 text-xl font-bold text-black">TaDa</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white px-6 py-2 font-medium transition-colors"
              >
                Join TaDa
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white py-4">
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 font-medium"
              >
                Join TaDa
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Welcome Block */}
      {showWelcome && (
        <section className="relative bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32">
            {/* Close button */}
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Find Your Perfect Home
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Skip the endless scrolling. Let AI match you with properties
                that truly fit your lifestyle.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setShowWelcome(false)}
                className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg font-medium"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Properties
              </Button>
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="bg-transparent border border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg font-medium transition-all"
              >
                Join Community
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Properties Section */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
              Browse Properties
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover carefully curated properties in London's most
              sought-after locations
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search by location, property type, or features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 pr-16 border border-gray-200 rounded-2xl text-lg placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Properties Grid */}
          {error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Unable to load properties
              </h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : (
            <>
              <PropertyGridWithLoader
                properties={properties}
                loading={loading || searchLoading}
                onPropertyClick={handlePropertyClick}
                showShortlist={false}
                skeletonCount={6}
              />

              {/* Limited Access Notice */}
              {!loading && properties.length >= 6 && (
                <div className="text-center py-16 bg-gray-50 rounded-2xl mt-12">
                  <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">
                    You're viewing a limited selection
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Join TaDa to access all properties, save favorites, and get
                    personalized AI matches
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => setAuthModalOpen(true)}
                      className="bg-black hover:bg-gray-800 text-white px-8 py-3 font-medium"
                    >
                      Create Account
                    </Button>
                    <Button
                      onClick={() => setAuthModalOpen(true)}
                      className="bg-transparent border border-black text-black hover:bg-black hover:text-white px-8 py-3 font-medium transition-all"
                    >
                      Take Lifestyle Quiz
                    </Button>
                  </div>
                </div>
              )}

              {/* No Results */}
              {!loading && !searchLoading && properties.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">
                    No properties found
                  </h3>
                  <p className="text-gray-600 mb-8">
                    {searchTerm
                      ? "Try adjusting your search terms or browse all properties"
                      : "There are currently no properties available"}
                  </p>
                  {searchTerm && (
                    <Button
                      onClick={() => setSearchTerm("")}
                      className="bg-black hover:bg-gray-800 text-white px-6 py-2"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="flex items-center mb-4">
                <Logo size="sm" />
                <span className="ml-2 text-2xl font-bold">TaDa</span>
              </div>
              <p className="text-gray-400">
                AI-powered property matching for London's discerning residents
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Browse</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button className="hover:text-white transition-colors">
                    All Properties
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    Featured Listings
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    New Developments
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button className="hover:text-white transition-colors">
                    About Us
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    Contact
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">© 2024 TaDa. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setNeedsRoleSelection(false);
        }}
        forceRoleSelection={needsRoleSelection}
        isOAuthRoleSelection={needsRoleSelection}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black"></div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
