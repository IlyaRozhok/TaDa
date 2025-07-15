"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { ArrowRight, Home, Users, Search, Heart } from "lucide-react";

export default function LandingPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  useEffect(() => {
    // Если пользователь аутентифицирован, перенаправляем на соответствующий дашборд
    if (isAuthenticated && user) {
      if (user.roles?.includes("operator")) {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard/tenant");
      }
    }
  }, [isAuthenticated, user, router]);

  // Если пользователь аутентифицирован, показываем загрузку пока происходит редирект
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Перенаправление на дашборд...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                TaDa
              </span>
            </div>

            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900"
              >
                How it works
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">
                About
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/app/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/app/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight">
              Find Your Perfect
              <span className="text-blue-600"> Rental Home</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              TaDa connects tenants with property operators through smart
              matching. Discover amazing properties that match your lifestyle
              and preferences.
            </p>
            <div className="mt-10 flex justify-center gap-x-6">
              <Link href="/app/auth/register?type=tenant">
                <Button size="lg" className="px-8">
                  Find a Property
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/app/auth/register?type=operator">
                <Button variant="outline" size="lg" className="px-8">
                  List Your Property
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-64 sm:h-96 flex items-center justify-center">
                <div className="text-white text-center">
                  <Home className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <p className="text-xl font-semibold">
                    Beautiful Properties Await
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Why Choose TaDa?
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              We make rental search and property management effortless
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center">
                <Search className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Smart Matching
              </h3>
              <p className="mt-4 text-gray-600">
                Our algorithm matches you with properties that fit your
                lifestyle, budget, and location preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                For Everyone
              </h3>
              <p className="mt-4 text-gray-600">
                Whether you&apos;re a tenant looking for a home or an operator
                managing properties, we&apos;ve got you covered.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <Heart className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Personalized
              </h3>
              <p className="mt-4 text-gray-600">
                Set your preferences once and get personalized recommendations
                that match your unique needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Getting started is simple and fast
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* For Tenants */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                For Tenants
              </h3>
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">
                      Create Your Profile
                    </h4>
                    <p className="text-gray-600">
                      Tell us about your lifestyle, budget, and preferences
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">
                      Get Smart Matches
                    </h4>
                    <p className="text-gray-600">
                      Receive personalized property recommendations
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">
                      Find Your Home
                    </h4>
                    <p className="text-gray-600">
                      Browse, shortlist, and connect with operators
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Operators */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                For Property Operators
              </h3>
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">
                      List Your Properties
                    </h4>
                    <p className="text-gray-600">
                      Upload property details, photos, and amenities
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">
                      Reach Quality Tenants
                    </h4>
                    <p className="text-gray-600">
                      Get matched with pre-qualified, interested tenants
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">
                      Manage Efficiently
                    </h4>
                    <p className="text-gray-600">
                      Track interest, manage listings, and connect with
                      prospects
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Join thousands of tenants and operators using TaDa
          </p>
          <div className="mt-8 flex justify-center gap-x-6">
            <Link href="/app/auth/register?type=tenant">
              <Button size="lg" variant="secondary" className="px-8">
                Find Properties
              </Button>
            </Link>
            <Link href="/app/auth/register?type=operator">
              <Button
                size="lg"
                variant="outline"
                className="px-8 border-white text-white hover:bg-white hover:text-blue-600"
              >
                List Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <Home className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">TaDa</span>
              </div>
              <p className="mt-4 text-gray-400">
                Connecting tenants and property operators through smart
                matching.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Tenants</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/properties" className="hover:text-white">
                    Browse Properties
                  </a>
                </li>
                <li>
                  <a
                    href="/app/auth/register?type=tenant"
                    className="hover:text-white"
                  >
                    Sign Up
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    How it Works
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Operators</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="/app/auth/register?type=operator"
                    className="hover:text-white"
                  >
                    List Property
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Resources
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#about" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TaDa Rental Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
