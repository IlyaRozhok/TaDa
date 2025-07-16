"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "./store/slices/authSlice";
import Link from "next/link";
import { Button } from "./components/ui/Button";
import { useTranslations } from "./lib/language-context";
import { getUserRole, getDashboardPath } from "./components/DashboardRouter";
import Logo from "./components/Logo";

export default function Home() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = getUserRole(user);
      const dashboardPath = getDashboardPath(userRole);
      router.push(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)), url('/background.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-center bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800 font-medium">
            {t.auth.redirectingToDashboard}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-slate-900 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)), url('/background.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-4 lg:px-6">
          <nav className="flex justify-between items-center">
            {/* Logo Section */}
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <Logo
                  size="sm"
                  className="transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                />
              </div>
              <span className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer group-hover:scale-105">
                TaDa
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                How it works
              </Link>
              <Link
                href="#contact"
                className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                Contact
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <Link href="/app/auth/login">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200 font-medium"
                >
                  {t.nav.login}
                </Button>
              </Link>
              <Link href="/app/auth/register">
                <Button className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-medium px-6">
                  {t.nav.register}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-md hover:bg-slate-100 transition-colors">
              <svg
                className="w-6 h-6 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        {/* Main TaDa Logo with Bouncing Animation */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <Logo size="xl" className="mr-6" />
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-slate-900 select-none">
              TaDa
            </h1>
            {/* Bouncing Circle - Keeping as requested */}
            <div className="ml-6 animate-bounce">
              <div className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-slate-900 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Message - Liquid Simple Style */}
        <div className="text-center mb-20 max-w-5xl mx-auto">
          <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl transition-all duration-500 ease-out hover:shadow-3xl hover:scale-[1.02] hover:bg-white/50 p-12 md:p-16">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-slate-400/20 to-slate-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute top-1/2 right-0 w-32 h-32 bg-gradient-to-br from-slate-500/20 to-slate-600/20 rounded-full blur-2xl animate-pulse delay-300" />
              <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-gradient-to-br from-slate-400/20 to-slate-500/20 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-slate-600/30 rounded-full animate-bounce" />
              <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-slate-700/40 rounded-full animate-bounce delay-200" />
              <div className="absolute top-1/2 left-3/4 w-4 h-4 bg-slate-600/25 rounded-full animate-bounce delay-500" />
              <div className="absolute top-1/6 right-1/3 w-2 h-2 bg-slate-500/35 rounded-full animate-bounce delay-700" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight drop-shadow-lg">
                INTRODUCING THE FUTURE OF PROPERTY
              </h2>
              <p className="text-2xl md:text-3xl lg:text-4xl font-light text-slate-600 drop-shadow-md">
                WHERE HOME FINDS YOU!
              </p>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/15 to-transparent rounded-[inherit] animate-pulse" />
          </div>
        </div>

        {/* Problem Statement - Liquid Simple Style */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="relative overflow-hidden bg-white/50 backdrop-blur-xl border border-white/30 rounded-3xl shadow-xl transition-all duration-500 ease-out hover:shadow-2xl hover:scale-[1.01] hover:bg-white/60 p-8 md:p-12">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-25">
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-slate-400/25 to-slate-500/25 rounded-full blur-xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-br from-slate-500/25 to-slate-600/25 rounded-full blur-xl animate-pulse delay-500" />
              <div className="absolute top-1/2 left-1/2 w-44 h-44 bg-gradient-to-br from-slate-400/20 to-slate-500/20 rounded-full blur-2xl animate-pulse delay-1000" />
            </div>

            {/* Background Image with overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{
                backgroundImage: "url(/key-crown.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            {/* Content */}
            <div className="relative z-10">
              <p className="text-xl md:text-2xl text-slate-700 text-center leading-relaxed drop-shadow-sm">
                Gone are the days of endless scrolling through property
                listings, countless calls, missed opportunities, and frustrating
                rental processes.
              </p>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/10 to-transparent rounded-[inherit] animate-pulse" />
          </div>
        </div>

        {/* CTA Buttons - Liquid Simple Style */}
        <div className="text-center mb-24 max-w-2xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-100/70 via-slate-200/60 to-slate-300/50 backdrop-blur-md border border-slate-300/40 rounded-2xl shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.02] p-8">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-slate-400/20 to-slate-500/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-500/20 to-slate-600/20 rounded-full blur-xl animate-pulse delay-700" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/app/auth/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white text-lg px-8 py-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 rounded-xl"
                  >
                    Get Started
                  </Button>
                </Link>
                <Link href="/app/dashboard/operator">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-slate-400/60 text-slate-700 hover:bg-white/60 hover:text-slate-800 text-lg px-8 py-4 transition-all duration-300 hover:shadow-lg hover:scale-105 rounded-xl backdrop-blur-sm"
                  >
                    For Operators
                  </Button>
                </Link>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/10 to-transparent rounded-[inherit] animate-pulse" />
          </div>
        </div>

        {/* Features Section */}
        <div
          id="features"
          className="grid md:grid-cols-3 gap-8 mb-24 max-w-6xl mx-auto"
        >
          <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-8 text-center hover:shadow-lg hover:bg-white/70 transition-all duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Smart Matching
            </h3>
            <p className="text-slate-600 leading-relaxed">
              AI-powered system finds your perfect home based on your lifestyle
              and preferences.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-8 text-center hover:shadow-lg hover:bg-white/70 transition-all duration-300">
            <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Verified Properties
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Every listing is verified and quality-checked. No fake photos, no
              surprises.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-8 text-center hover:shadow-lg hover:bg-white/70 transition-all duration-300">
            <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Perfect Matches
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Connect with compatible housemates and landlords for the ideal
              living situation.
            </p>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto hover:bg-white/70 transition-all duration-300 shadow-xl hover:shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Ready to find your perfect home?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join the revolution. Let technology do the work while you focus on
            what matters.
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
      <footer id="contact" className="container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-8 md:p-12 transition-all duration-500 hover:bg-white/70 hover:shadow-3xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                TaDa
              </h3>
              <p className="text-slate-600 mb-4">
                The future of property matching. Where home finds you.
              </p>
              <div className="flex items-center space-x-3">
                <Logo size="sm" />
                <span className="text-xl font-bold text-slate-900">TaDa</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <a
                    href="#features"
                    className="hover:text-slate-900 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-slate-900 transition-colors"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <Link
                    href="/app/auth/register"
                    className="hover:text-slate-900 transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/app/dashboard/operator"
                    className="hover:text-slate-900 transition-colors"
                  >
                    For Operators
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Contact
              </h3>
              <div className="space-y-2 text-slate-600">
                <p>Email: hello@tada.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Address: 123 Tech Street, Silicon Valley, CA</p>
              </div>
            </div>
          </div>
          <div className="text-center text-slate-500 pt-8 border-t border-slate-200">
            <p>© 2024 TaDa - Where Home Finds You!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
