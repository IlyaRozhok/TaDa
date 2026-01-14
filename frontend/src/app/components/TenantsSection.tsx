"use client";

import React from "react";
import Image from "next/image";
import ResponsiveCardsDisplay from "./ResponsiveCardsDisplay";
import { useTranslation } from "../hooks/useTranslation";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";

const TenantsSection = () => {
  const { t } = useTranslation();
  const tenantCards = [
    {
      id: 1,
      category: t(operatorKeys.rent.card1.label),
      title: t(operatorKeys.rent.card1.title),
      text: t(operatorKeys.rent.card1.description),
      description: t(operatorKeys.rent.card1.description),
      icon: true,
    },
    {
      id: 2,
      category: t(operatorKeys.rent.card2.label),
      title: t(operatorKeys.rent.card2.title),
      text: t(operatorKeys.rent.card2.description),
      description: t(operatorKeys.rent.card2.description),
      icon: true,
    },
    {
      id: 3,
      category: t(operatorKeys.rent.card3.label),
      title: t(operatorKeys.rent.card3.title),
      text: t(operatorKeys.rent.card3.description),
      description: t(operatorKeys.rent.card3.description),
      icon: true,
    },
    {
      id: 4,
      category: t(operatorKeys.rent.card4.label),
      title: t(operatorKeys.rent.card4.title),
      text: t(operatorKeys.rent.card4.description),
      description: t(operatorKeys.rent.card4.description),
      icon: true,
    },
  ];

  return (
    <section id="tenants" className="md:py-21 py-5 relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/operator-reinvent-bg.png"
          alt="Background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={85}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-start mb-16">
          <p className="text-white text-2xl font-medium mb-4 mt-5">
            {t(operatorKeys.rent.label)}
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-sf-pro font-semibold text-white leading-tight max-w-4xl lg:mx-0 mx-auto">
            {t(operatorKeys.rent.title)}
          </h2>
          <p className="text-white text-2xl mt-6 lg:mx-0 mx-auto">
            {t(operatorKeys.rent.subtitle)}
          </p>
        </div>
      </div>

      {/* Responsive Cards Display - uses same container padding */}
      <ResponsiveCardsDisplay cards={tenantCards} />
    </section>
  );
};

export default TenantsSection;
