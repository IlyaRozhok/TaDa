"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "./store/slices/authSlice";
import Link from "next/link";
import { Button } from "./components/ui/Button";
import Logo from "./components/Logo";
import SimpleFeaturedSection from "./components/SimpleFeaturedSection";
import { Search, ArrowRight, Menu, X } from "lucide-react";

export default function Home() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push("/app/dashboard");
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Logo size="sm" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center">
              <Link href="/app/auth/register">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Sign Up
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-900" />
              ) : (
                <Menu className="w-6 h-6 text-gray-900" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="py-4 px-4">
                <Link
                  href="/app/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile-Optimized Hero Section */}
      <section className="pt-8 pb-16 px-4 sm:pt-12 sm:pb-20 lg:pt-20 lg:pb-32">
        <div className="max-w-6xl mx-auto text-center">
          {/* Mobile-First Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Find Your Perfect Home
          </h1>

          {/* Mobile-Friendly Description */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed">
            Skip the endless scrolling and let our AI match you with properties
            that fit your lifestyle. No registration required to start browsing.
          </p>

          {/* Mobile-First CTAs */}
          <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-col sm:gap-4 md:flex-row md:justify-center">
            <Link href="/properties" className="block sm:inline-block">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Properties Now
              </Button>
            </Link>
            <Link href="/app/auth/login" className="block sm:inline-block">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium"
              >
                Join
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Mobile-Friendly Subtext */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-gray-500">
            No account needed to start exploring
          </p>
        </div>
      </section>

      {/* Featured Properties & Developments Section */}
      <SimpleFeaturedSection />

      {/* Mobile-Optimized Footer */}
      <footer className="py-8 sm:py-12 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col space-y-6 md:flex-row md:justify-between md:items-center md:space-y-0">
            {/* Footer Logo */}
            <div className="flex justify-center md:justify-start items-center">
              <Logo size="sm" />
              <span className="ml-2 text-lg font-bold text-gray-900">TaDa</span>
            </div>

            {/* Footer Links */}
            <div className="grid grid-cols-2 gap-4 text-center md:flex md:space-x-6 text-sm text-gray-600">
              <Link
                href="/properties"
                className="hover:text-gray-900 transition-colors py-2"
              >
                Properties
              </Link>
              <Link
                href="/about"
                className="hover:text-gray-900 transition-colors py-2"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="hover:text-gray-900 transition-colors py-2"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="hover:text-gray-900 transition-colors py-2"
              >
                Privacy
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 sm:mt-8 text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
            © 2024 TaDa. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
