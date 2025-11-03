"use client";

import React from "react";
import HeroSection from "./HeroSection";

const HeroWrapper = () => {
  return (
    <section id="hero" className="relative min-h-screen">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bg.png')",
        }}
      ></div>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Content */}
      <div className="relative z-10">
        <HeroSection />
      </div>
    </section>
  );
};

export default HeroWrapper;
