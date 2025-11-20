"use client";

import React, { useEffect, useRef, useState } from "react";
import AnimatedCardsContainer from "./AnimatedCardsContainer";
import CardsSlider from "./CardsSlider";
import YouTubePlayer from "./YouTubePlayer";
import { useTranslation } from "../hooks/useTranslation";
import { generalKeys } from "../lib/translationsKeys/generalKeys";

const SocialMediaSection = () => {
  const { t } = useTranslation();
  const socialCards = [
    {
      id: 1,
      image: "/img_social_00.png",
    },
    {
      id: 2,
      image: "/img_social_01.png",
    },
    {
      id: 3,
      image: "/img_social_02.png",
    },
    {
      id: 4,
      image: "/img_social_03.png",
    },
  ];

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsVideoOpen(false);
    };
    if (isVideoOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isVideoOpen]);

  return (
    <section id="social-media" className="py-0 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:pt-20">
        {/* Section Header */}
        <div className="mb-16">
          <p className="text-gray-600 text-lg font-medium mb-2 mt-10">
            {t(generalKeys.social.label)}
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-sf-pro font-semibold text-gray-900 max-w-4xl">
            {t(generalKeys.social.title)}
          </h2>
          <p className="text-gray-600 text-lg mt-8 max-w-md">
            {t(generalKeys.social.subtitle)}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={() => setIsVideoOpen(true)}
              className="bg-black text-white px-8 py-4 rounded-full cursor-pointer hover:bg-black/20 hover:text-white transition-colors"
            >
              {t(generalKeys.social.ctaVideo)}
            </button>
            <a
              target="_blank"
              href="https://www.instagram.com/tada.london"
              className="text-black cursor-pointer font-semibold hover:text-gray-600 transition-colors flex items-center"
            >
              {t(generalKeys.social.ctaInstagram)}
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Desktop: Animated Cards */}
        <div className="hidden lg:block">
          <AnimatedCardsContainer
            cards={socialCards}
            triggerOffset={["start 0.8", "end 1"]}
          />
        </div>

        {/* Additional Content Section */}
        <div className="md:mt-20 md:mb-20 mb-10">
          <h3 className="text-2xl md:text-4xl lg:text-5xl font-sf-pro font-semibold text-gray-900 leading-tight max-w-4xl mb-8">
            <span className="bg-gradient-to-r from-[#909447] to-[#1D1D1F] bg-clip-text text-transparent">
              {t(generalKeys.social.gradientTextTop)}
            </span>
          </h3>

          <h4 className="text-2xl text-black md:text-4xl lg:text-5xl font-sf-pro font-semibold leading-tight max-w-[780px] ml-[30%]">
            <span className="bg-gradient-to-r from-[#ECC5C5] to-[#1D1D1F] bg-clip-text text-transparent">
              {t(generalKeys.social.gradientTextBottom)}
            </span>
          </h4>
        </div>
      </div>

      {/* Mobile: Cards Slider */}
      <div className="block lg:hidden">
        <CardsSlider cards={socialCards} />
      </div>

      {isVideoOpen && (
        <div
          ref={backdropRef}
          onClick={(e) => {
            if (e.target === backdropRef.current) setIsVideoOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="relative w-full max-w-[420px] sm:max-w-[520px] md:max-w-[400px] md:max-h-[600px] lg:max-w-[400px] lg:max-h-[600px] mx-auto">
            {/* Close */}
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white text-xl font-semibold transition-colors shadow-lg"
              aria-label="Close video"
            >
              ✕
            </button>
            <YouTubePlayer
              videoId="-y319Sm4Cxo"
              title="TA-DA example short"
              ratio="9:16"
              rounded
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default SocialMediaSection;
