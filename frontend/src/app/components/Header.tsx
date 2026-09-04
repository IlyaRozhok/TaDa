"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import BookACallModal from "./BookACallModal";
import LanguageDropdown from "./LanguageDropdown";
import { useTranslation, translateWithFallback } from "../hooks/useTranslation";
import { generalKeys } from "../lib/translationsKeys/generalKeys";
import { tenantKeys } from "../lib/translationsKeys/tenantTranslationKeys";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";
import { onboardingKeys } from "../lib/translationsKeys/onboardingTranslationKeys";

interface HeaderProps {
  onSignIn?: () => void;
  children?: React.ReactNode;
  landingType?: "operators" | "tenants";
  disabled?: boolean;
}

const Header = ({
  children,
  landingType = "operators",
  disabled = false,
}: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isBookACallOpen, setIsBookACallOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useTranslation();

  const bookACallLabel = translateWithFallback(
    t,
    generalKeys.bookACall.title,
    "Book a call",
  );

  // Close both menus when landing type changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDesktopMenuOpen(false);
  }, [landingType]);

  // Desktop menu: close on outside click and on Escape.
  // Same pattern as LanguageDropdown, plus the keyboard escape hatch.
  useEffect(() => {
    if (!isDesktopMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopMenuRef.current &&
        !desktopMenuRef.current.contains(event.target as Node)
      ) {
        setIsDesktopMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDesktopMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDesktopMenuOpen]);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    if (disabled) return;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    // Close the menus after navigation
    setIsMobileMenuOpen(false);
    setIsDesktopMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    if (disabled) return;
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Navigation items based on landing type
  const getNavigationItems = () => {
    if (landingType === "tenants") {
      return [
        { id: "hero", label: `${t(tenantKeys.header.home)}` },
        { id: "cards", label: `${t(tenantKeys.header.howItWorks)}` },
        {
          id: "generation-rent",
          label: `${t(tenantKeys.header.generationRent)}`,
        },
        {
          id: "relocation-support",
          label: `${t(tenantKeys.header.relocation)}`,
        },
        {
          id: "social-media",
          label: `${t(tenantKeys.header.socialMedia)}`,
        },
        { id: "partners", label: `${t(tenantKeys.header.partners)}` },
      ];
    } else {
      return [
        { id: "hero", label: `${t(operatorKeys.header.home)}` },
        { id: "cards", label: `${t(operatorKeys.header.howItWorks)}` },
        {
          id: "partners",
          label: `${t(operatorKeys.header.partners)}`,
        },
        { id: "tenants", label: `${t(operatorKeys.header.forTenants)}` },
        {
          id: "spotlight",
          label: `${t(operatorKeys.header.spotlight)}`,
        },
        {
          id: "about-us",
          label: `${t(operatorKeys.header.about)}`,
        },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  // The audience link lives in the desktop burger menu instead of the inline
  // nav: "Partners" on the tenants landing, "About Us" on the operators one.
  // Both keep their existing scroll target and translation key; the mobile
  // menu still lists every item.
  const audienceItemId = landingType === "tenants" ? "partners" : "about-us";
  const audienceItem = navigationItems.find(
    (item) => item.id === audienceItemId,
  );
  const inlineNavigationItems = navigationItems.filter(
    (item) => item.id !== audienceItemId,
  );

  const toggleDesktopMenu = () => {
    if (disabled) return;
    setIsDesktopMenuOpen(!isDesktopMenuOpen);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 py-0.75 sm:py-1 ${
          disabled ? "pointer-events-none" : ""
        }`}
      >
        <div className="container mx-auto">
          <div className="rounded-full px-4 py-2 md:py-3">
            <div
              className={`h-18 rounded-full px-4 flex items-center justify-between bg-black/50 backdrop-blur-[3px] ${
                disabled ? "opacity-70" : ""
              }`}
            >
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 pl-5">
                <button
                  onClick={() => scrollToSection("hero")}
                  disabled={disabled}
                  className="disabled:cursor-default"
                >
                  <img
                    src="/landing-logo.svg"
                    alt="TADA Logo"
                    className="w-[75px] cursor-pointer p"
                  />
                </button>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-6">
                {inlineNavigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    disabled={disabled}
                    className="text-white hover:text-gray-400 transition-colors text-sm cursor-pointer disabled:cursor-default disabled:hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Right side elements */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Additional elements (like switcher) - hidden on very small
                    screens, and on lg+ it moves into the desktop menu below */}
                <div className="hidden sm:block lg:hidden">{children}</div>

                {/* Language Dropdown - on lg+ it moves into the desktop menu */}
                <div className="lg:hidden">
                  <LanguageDropdown
                    variant="dark"
                    menuVariant="units"
                    disabled={disabled}
                  />
                </div>

                {/* Desktop menu - declutters the lg+ header by holding the
                    language switch, the landing toggle and the audience link.
                    Rendered only at lg+, where the mobile burger is hidden. */}
                <div className="relative hidden lg:block" ref={desktopMenuRef}>
                  <button
                    onClick={toggleDesktopMenu}
                    disabled={disabled}
                    aria-label="Menu"
                    aria-haspopup="menu"
                    aria-expanded={isDesktopMenuOpen}
                    className="flex items-center justify-center text-white hover:text-gray-400 transition-colors p-2 rounded-full cursor-pointer disabled:cursor-default disabled:hover:text-white"
                  >
                    <Menu className="w-6 h-6" />
                  </button>

                  {isDesktopMenuOpen && !disabled && (
                    <div className="absolute right-0 top-full mt-3 w-72 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl p-3 z-50">
                      {/* 1. Language switch */}
                      <div className="px-1 py-1">
                        <LanguageDropdown variant="dark" menuVariant="units" />
                      </div>

                      {/* 2. Landing toggle (Operators / Tenants) */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        {children}
                      </div>

                      {/* 3. Audience link: Partners (tenants) / About Us (operators) */}
                      {audienceItem && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <button
                            onClick={() => scrollToSection(audienceItem.id)}
                            className="block w-full text-left text-white hover:bg-white/10 transition-colors py-3 px-3 rounded-xl text-sm font-medium cursor-pointer"
                          >
                            {audienceItem.label}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Book a call - opens the landing's call-request modal */}
                <button
                  onClick={() => {
                    if (disabled) return;
                    setIsBookACallOpen(true);
                  }}
                  disabled={disabled}
                  className="border border-white cursor-pointer text-white px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-full hover:bg-white hover:text-black transition-colors font-medium text-xs sm:text-sm flex-shrink-0 hidden lg:inline disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-white"
                >
                  {bookACallLabel}
                </button>

                {/* Get Started CTA - navigates to auth */}
                <button
                  onClick={() => {
                    if (disabled) return;
                    router.push("/app/auth");
                  }}
                  disabled={disabled}
                  className="bg-black cursor-pointer text-white px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-full hover:bg-black/20 transition-colors font-medium text-xs sm:text-sm flex-shrink-0 hidden lg:inline disabled:cursor-default disabled:hover:bg-black"
                >
                  {t(onboardingKeys.headerCtaGetStarted)}
                </button>

                {/* Mobile menu button */}
                <button
                  className="lg:hidden text-white flex-shrink-0 disabled:cursor-default"
                  onClick={toggleMobileMenu}
                  disabled={disabled}
                >
                  <svg
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
                      isMobileMenuOpen ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && !disabled && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Menu Panel */}
          <div className="absolute top-24 left-4 right-4 bg-black/50 backdrop-blur-[3px] rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top duration-300">
            {/* Get Started CTA - navigates to auth */}
            <div className="mb-3 border-gray-200/30">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/app/auth");
                }}
                className="w-full bg-black text-white px-6 py-4 rounded-full font-semibold hover:bg-black/50 hover:text-white transition-colors text-base cursor-pointer"
              >
                {t(onboardingKeys.headerCtaGetStarted)}
              </button>
            </div>

            {/* Book a call - the desktop pill's mobile counterpart */}
            <div className="mb-6 border-gray-200/30">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsBookACallOpen(true);
                }}
                className="w-full border border-white text-white px-6 py-4 rounded-full font-semibold hover:bg-white hover:text-black transition-colors text-base cursor-pointer"
              >
                {bookACallLabel}
              </button>
            </div>

            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left text-white hover:bg-gray-100/30 transition-colors py-4 px-4 rounded-lg text-lg font-medium"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            {/* Switcher in mobile menu */}
            <div className="mt-6 w-full">
              <div className="sm:hidden">{children}</div>
            </div>
          </div>
        </div>
      )}

      {/* Book a Call Modal */}
      {!disabled && (
        <BookACallModal
          isOpen={isBookACallOpen}
          onClose={() => setIsBookACallOpen(false)}
          audience={landingType === "tenants" ? "tenant" : "operator"}
        />
      )}
    </>
  );
};

export default Header;
