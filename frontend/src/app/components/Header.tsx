"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import RequestDemoModal from "./RequestDemoModal";
import {
  useI18n,
  SUPPORTED_LANGUAGES,
  getLanguageDisplayCode,
} from "../contexts/I18nContext";
import { useTranslation } from "../hooks/useTranslation";
import { tenantKeys } from "../lib/translationsKeys/tenantTranslationKeys";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";

interface HeaderProps {
  onSignIn?: () => void;
  children?: React.ReactNode;
  landingType?: "operators" | "tenants";
}

const Header = ({ children, landingType = "operators" }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const { language, setLanguage } = useI18n();
  const selectedLanguage = getLanguageDisplayCode(language);
  const [isRequestDemoOpen, setIsRequestDemoOpen] = useState(false);
  const [modalSource, setModalSource] = useState<
    | "tenant-contact"
    | "operator-request-demo"
    | "operator-spotlight"
    | undefined
  >(undefined);
  const { t } = useTranslation();

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".language-dropdown")) {
        setIsLanguageOpen(false);
      }
    };

    if (isLanguageOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isLanguageOpen]);

  // Close mobile menu when landing type changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [landingType]);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    // Close mobile menu after navigation
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 py-3 md:py-4">
        <div className="container mx-auto">
          <div className="rounded-full px-4 py-2 md:py-3">
            <div className="h-18 rounded-full px-4 flex items-center justify-between bg-black/50 backdrop-blur-[3px]">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0">
                <button
                  onClick={() => scrollToSection("hero")}
                  className="text-white text-sm sm:text-lg md:text-xl font-semibold"
                >
                  <img
                    src="/landing-logo.svg"
                    alt="TADA Logo"
                    className="h-6 pl-5 cursor-pointer"
                  />
                </button>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-6">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-white hover:text-gray-400 transition-colors text-sm cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Right side elements */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Additional elements (like switcher) - hidden on very small screens */}
                <div className="hidden sm:block">{children}</div>

                {/* Language Dropdown */}
                <div className="relative language-dropdown">
                  <button
                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 text-sm font-medium text-white hover:text-gray-300 transition-colors rounded-lg w-14 cursor-pointer"
                  >
                    <span className="min-w-[1.5rem] text-center">
                      {selectedLanguage}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 flex-shrink-0 transition-transform ${
                        isLanguageOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isLanguageOpen && (
                    <div className="absolute right-0 top-full mt-6 rounded-xl shadow-lg bg-black/50 backdrop-blur-[10px] border-gray-200 min-w-[150px] z-50">
                      <div className="max-h-80 overflow-y-auto rounded-xl">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.langCode);
                              setIsLanguageOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 hover:text-black transition-colors bg-black/50 backdrop-blur-[10px] ${
                              selectedLanguage === lang.code
                                ? "bg-black font-semibold"
                                : "text-gray-400"
                            }`}
                          >
                            {lang.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Request Demo Button */}
                <button
                  onClick={() => {
                    setModalSource(
                      landingType === "tenants"
                        ? "tenant-contact"
                        : "operator-request-demo"
                    );
                    setIsRequestDemoOpen(true);
                  }}
                  className="bg-black cursor-pointer text-white px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-full hover:bg-black/20 transition-colors font-medium text-xs sm:text-sm flex-shrink-0 hidden lg:inline"
                >
                  <span className="hidden sm:inline">
                    {landingType === "tenants"
                      ? `${t(tenantKeys.header.ctaBtn)}`
                      : `${t(operatorKeys.header.ctaBtn)}`}
                  </span>
                  <span className="sm:hidden">
                    {landingType === "tenants" ? "Contact" : "Demo"}
                  </span>
                </button>

                {/* Mobile menu button */}
                <button
                  className="lg:hidden text-white flex-shrink-0"
                  onClick={toggleMobileMenu}
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
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Menu Panel */}
          <div className="absolute top-24 left-4 right-4 bg-black/50 backdrop-blur-[3px] rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top duration-300">
            {/* Request Demo Button */}
            <div className="mb-6 border-gray-200/30">
              <button
                onClick={() => {
                  setModalSource(
                    landingType === "tenants"
                      ? "tenant-contact"
                      : "operator-request-demo"
                  );
                  setIsRequestDemoOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-black text-white px-6 py-4 rounded-full font-semibold hover:bg-black/50 hover:text-white transition-colors text-base cursor-pointer"
              >
                {landingType === "tenants"
                  ? `${t(tenantKeys.header.ctaBtn)}`
                  : `${t(operatorKeys.header.ctaBtn)}`}
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

      {/* Request Demo Modal */}
      <RequestDemoModal
        isOpen={isRequestDemoOpen}
        onClose={() => {
          setIsRequestDemoOpen(false);
          setModalSource(undefined);
        }}
        landingType={landingType}
        modalSource={modalSource}
      />
    </>
  );
};

export default Header;
