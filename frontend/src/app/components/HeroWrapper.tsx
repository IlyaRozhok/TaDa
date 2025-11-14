"use client";

import React from "react";
import Image from "next/image";
import HeroSection from "./HeroSection";

const HeroWrapper = () => {
  return (
    <section id="hero" className="relative min-h-screen">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/bg.png"
          alt="Background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={85}
        />
      </div>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 z-[1]"></div>

      {/* Content */}
      <div className="relative z-10">
        <HeroSection />
      </div>
    </section>
  );
};

export default HeroWrapper;
