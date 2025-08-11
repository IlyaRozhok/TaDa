"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "./store/slices/authSlice";
import Image from "next/image";
import Link from "next/link";
import { Building2, Users, MapPin, Shield, Star, Clock } from "lucide-react";

export default function Home() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect authenticated users to their dashboard
    if (isAuthenticated && user) {
      const role = user.role || "tenant";
      router.replace(`/app/dashboard/${role}`);
    }
  }, [isAuthenticated, user, router]);

  // Show landing page for non-authenticated users
  if (isAuthenticated && user) {
    return null; // Redirecting...
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>

        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6">
            Find Your Perfect Home
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with trusted property operators and discover your ideal
            living space in London
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/app/auth"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>

            <Link
              href="/app/properties"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose TaDa?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Building2 className="w-8 h-8" />}
              title="Verified Properties"
              description="All properties are verified and managed by trusted operators"
            />

            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Direct Connection"
              description="Connect directly with property operators, no middlemen"
            />

            <FeatureCard
              icon={<MapPin className="w-8 h-8" />}
              title="Prime Locations"
              description="Properties in the best locations across London"
            />

            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Secure Platform"
              description="Your data and transactions are always secure"
            />

            <FeatureCard
              icon={<Star className="w-8 h-8" />}
              title="Quality Assured"
              description="High standards for all listed properties"
            />

            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Quick Process"
              description="Find and secure your home in record time"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Find Your New Home?
          </h2>

          <p className="text-xl text-gray-600 mb-8">
            Join thousands of happy tenants who found their perfect home through
            TaDa
          </p>

          <Link
            href="/app/auth"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Start Your Search
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
