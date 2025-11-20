"use client";

import React from "react";
import ResponsiveCardsDisplay from "./ResponsiveCardsDisplay";
import { useTranslation } from "../hooks/useTranslation";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";

const CardsSection = () => {
  const { t } = useTranslation();
  const cards = [
    {
      id: 1,
      image: "/black-woman.png",
      richText: t(operatorKeys.howItWorks.card1.regularText),
      boldText: t(operatorKeys.howItWorks.card1.boldText),
    },
    {
      id: 2,
      image: "/google.png",
      richText: t(operatorKeys.howItWorks.card2.regularText),
      boldText: t(operatorKeys.howItWorks.card2.boldText),
    },
    {
      id: 3,
      image: "/handshake.png",
      richText: t(operatorKeys.howItWorks.card3.regularText),
      boldText: t(operatorKeys.howItWorks.card3.boldText),
    },
    {
      id: 4,
      image: "/woman-laptop.png",
      richText: t(operatorKeys.howItWorks.card4.regularText),
      boldText: t(operatorKeys.howItWorks.card4.boldText),
    },
  ];

  return (
    <section
      id="cards"
      className="pt-5 md:py-20 bg-gradient-to-b from-white to-[#F5F5F7] overflow-hidden"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-start mb-16">
          <p className="text-black font-semibold text-md tracking-wide mb-4 mt-5">
            {t(operatorKeys.howItWorks.label)}
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-sf-pro font-semibold text-gray-900 max-w-4xl lg:mx-0 mx-auto">
            {t(operatorKeys.howItWorks.title)}
          </h2>
          <p className="text-gray-600 text-lg mt-6 max-w-2xl lg:mx-0 mx-auto">
            {t(operatorKeys.howItWorks.subtitle)}
          </p>
        </div>
      </div>

      {/* Responsive Cards Display */}
      <ResponsiveCardsDisplay cards={cards} />
    </section>
  );
};

export default CardsSection;
