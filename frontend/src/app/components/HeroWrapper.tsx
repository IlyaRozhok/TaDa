"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import HeroSection from "./HeroSection";

const HeroWrapper = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Force a small delay to ensure transition is visible on first load
    // This ensures the opacity-0 state is rendered before transition starts
    const timer = setTimeout(() => {
      // Small delay to ensure initial render with opacity-0
    }, 1);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen">
      {/* Background color fallback - matching image colors */}
      <div className="absolute inset-0 bg-black backdrop-blur-[1px]"></div>

      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/bg.png"
          alt="Background"
          fill
          priority
          fetchPriority="high"
          className={`object-cover transition-opacity duration-700 ease-in-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          sizes="100vw"
          quality={85}
          onLoadingComplete={() => {
            // Add small delay to ensure transition is visible
            setTimeout(() => setImageLoaded(true), 10);
          }}
          onLoad={() => {
            // Add small delay to ensure transition is visible
            setTimeout(() => setImageLoaded(true), 10);
          }}
        />
      </div>

      {/* Dark overlay for better text readability */}

      {/* Content */}
      <div className="relative z-10">
        <HeroSection />
      </div>
    </section>
  );
};

export default HeroWrapper;
