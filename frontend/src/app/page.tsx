"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "./store/slices/authSlice";
import Link from "next/link";
import { Button } from "./components/ui/Button";
import { useTranslations } from "./lib/language-context";

export default function Home() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.is_operator) {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard/tenant");
      }
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.auth.redirectingToDashboard}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer">
              TaDa
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/app/auth/login">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
              >
                {t.nav.login}
              </Button>
            </Link>
            <Link href="/app/auth/register">
              <Button className="bg-slate-900 hover:bg-slate-700 text-white border-0 shadow-sm transition-all duration-200">
                {t.nav.register}
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        {/* Main TaDa Logo with Bouncing Animation */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-slate-900 select-none">
              TaDa
            </h1>
            {/* Bouncing Circle - Keeping as requested */}
            <div className="ml-6 animate-bounce">
              <div className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-slate-900 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Message - Keeping exact text as requested */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight max-w-4xl mx-auto">
            INTRODUCING THE FUTURE OF PROPERTY
          </h2>
          <p className="text-2xl md:text-3xl lg:text-4xl font-light text-slate-600 max-w-3xl mx-auto">
            WHERE HOME FINDS YOU!
          </p>
        </div>

        {/* Problem Statement */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-slate-50 rounded-2xl p-8 md:p-12 border border-slate-200">
            <p className="text-xl md:text-2xl text-slate-700 text-center leading-relaxed">
              Gone are the days of endless scrolling through property listings, 
              countless calls, missed opportunities, and frustrating rental processes.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="text-center mb-24">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/app/auth/register">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-700 text-white text-lg px-8 py-4 shadow-sm transition-all duration-200"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/app/dashboard/operator">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 text-lg px-8 py-4 transition-all duration-200"
              >
                For Operators
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-24 max-w-6xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Smart Matching
            </h3>
            <p className="text-slate-600 leading-relaxed">
              AI-powered system finds your perfect home based on your lifestyle and preferences.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Verified Properties
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Every listing is verified and quality-checked. No fake photos, no surprises.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Perfect Matches
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Connect with compatible housemates and landlords for the ideal living situation.
            </p>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Ready to find your perfect home?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join the revolution. Let technology do the work while you focus on what matters.
          </p>
          <Link href="/app/auth/register">
            <Button
              size="lg"
              className="bg-slate-900 hover:bg-slate-700 text-white text-xl px-12 py-4 shadow-sm transition-all duration-200"
            >
              Start Now
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-slate-200">
        <div className="text-center text-slate-500">
          <p>© 2024 TaDa - Where Home Finds You!</p>
        </div>
      </footer>
    </div>
  );
}
