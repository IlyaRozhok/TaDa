"use client";

import React, { useState } from "react";
import Image from "next/image";
import TenantsSection from "./TenantsSection";

const TenantsWrapper = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section className="relative bg-white h-full">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/tenants-bg.png"
          alt="Background"
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          sizes="100vw"
          quality={85}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <TenantsSection />
      </div>
    </section>
  );
};

export default TenantsWrapper;
