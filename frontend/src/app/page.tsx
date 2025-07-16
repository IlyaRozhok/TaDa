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
                href="/app/properties"
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
            <Link href="/app/properties">
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

      {/* How It Works - Simplified */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How TaDa Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1. Browse or Take Quiz
              </h3>
              <p className="text-gray-600">
                Start exploring properties right away or take our quick
                lifestyle quiz for personalized matches
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <HomeIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                2. Get Matched
              </h3>
              <p className="text-gray-600">
                Our AI analyzes your preferences to show you properties that
                match your lifestyle
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                3. Connect
              </h3>
              <p className="text-gray-600">
                Save favorites and connect with property operators when
                you&apos;re ready
              </p>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="text-center mt-12">
            <Link href="/app/properties">
              <Button
                size="lg"
                variant="outline"
                className="border-gray-900 text-gray-900 hover:bg-gray-100"
              >
                Start Browsing Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                For Tenants
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-gray-900 rounded-full flex-shrink-0 mt-0.5"></div>
                  <p className="ml-3 text-gray-600">
                    Browse properties without creating an account
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-gray-900 rounded-full flex-shrink-0 mt-0.5"></div>
                  <p className="ml-3 text-gray-600">
                    Get AI-powered matches based on your lifestyle
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-gray-900 rounded-full flex-shrink-0 mt-0.5"></div>
                  <p className="ml-3 text-gray-600">
                    Save favorites and compare properties easily
                  </p>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                For Property Operators
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-gray-900 rounded-full flex-shrink-0 mt-0.5"></div>
                  <p className="ml-3 text-gray-600">
                    Reach qualified tenants automatically
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-gray-900 rounded-full flex-shrink-0 mt-0.5"></div>
                  <p className="ml-3 text-gray-600">
                    Reduce time spent on unsuitable inquiries
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-gray-900 rounded-full flex-shrink-0 mt-0.5"></div>
                  <p className="ml-3 text-gray-600">
                    Manage all your properties in one place
                  </p>
                </li>
              </ul>
              <Link href="/app/dashboard/operator">
                <Button className="mt-6 bg-gray-900 hover:bg-gray-800 text-white">
                  List Your Properties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Find Your Next Home?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join thousands of happy tenants who found their perfect match with
            TaDa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app/properties">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                Browse Properties
              </Button>
            </Link>
            <Link href="/app/auth/register">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
              <Link href="/app/properties" className="hover:text-gray-900">
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
