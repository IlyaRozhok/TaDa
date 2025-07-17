"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "./store/slices/authSlice";
import Link from "next/link";
import { Button } from "./components/ui/Button";
import Logo from "./components/Logo";
import { Search, Home as HomeIcon, Users, ArrowRight } from "lucide-react";

export default function Home() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

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
      {/* Simple Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Logo size="sm" />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                TaDa
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              <Link
                href="/properties"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Browse Properties
              </Link>
              <Link
                href="/app/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Login
              </Link>
              <Link href="/app/auth/register">
                <Button
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Sign Up
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Simplified */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect Home
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Skip the endless scrolling and let our AI match you with properties
            that fit your lifestyle. No registration required to start browsing.
          </p>

          {/* Main CTA - Browse without registration */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/properties">
              <Button
                size="lg"
                className="bg-gray-900 hover:bg-gray-800 text-white px-8"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Properties Now
              </Button>
            </Link>
            <Link href="/app/preferences">
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Take Lifestyle Quiz
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            No account needed to start exploring
          </p>
        </div>
      </section>

      {/* Benefits Section */}

      {/* Final CTA */}

      {/* Simple Footer */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Logo size="sm" />
              <span className="ml-2 text-lg font-semibold text-gray-900">
                TaDa
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link href="/properties" className="hover:text-gray-900">
                Properties
              </Link>
              <Link href="/about" className="hover:text-gray-900">
                About
              </Link>
              <Link href="/contact" className="hover:text-gray-900">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-gray-900">
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2024 TaDa. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
