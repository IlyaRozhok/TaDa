"use client";

import React from "react";
import Image from "next/image";
import { useTranslation } from "../hooks/useTranslation";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";
import { tenantKeys } from "../lib/translationsKeys/tenantTranslationKeys";

interface PartnersSectionProps {
  landingType?: "operators" | "tenants";
}

const PartnersSection = ({
  landingType = "operators",
}: PartnersSectionProps) => {
  const { t } = useTranslation();

  // Choose keys based on landing type
  const keys = landingType === "tenants" ? tenantKeys : operatorKeys;

  const partners = [
    {
      id: 1,
      name: "Stripe",
      logo: "/stripe.png",
      description: t(keys.partners.stripe),
      highlighted: false,
    },
    {
      id: 2,
      name: "Experian",
      logo: "/experian.png",
      description: t(keys.partners.experian),
      highlighted: false,
    },
    {
      id: 3,
      name: "Deposit Protection Service",
      logo: "/depos-protect-service.png",
      description: t(keys.partners.dps),
      highlighted: false,
    },
    {
      id: 4,
      name: "Octopus Energy",
      logo: "/octopus.png",
      description: t(keys.partners.energy),
      highlighted: false,
    },
  ];

  return (
    <section
      id="partners"
      className="lg:py-25 mb-10 md:mb-0 bg-white border-gray-100"
    >
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="text-center md:mb-16 mt-10 md:mt-0">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-sf-pro font-semibold text-gray-900 mb-8">
            {t(keys.partners.title)}
          </h2>
        </div>

        {/* Partners Grid */}
        <div className="max-w-6xl mx-auto">
          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="p-8 border border-gray-200 rounded-2xl text-center bg-white"
              >
                {/* Partner Logo */}
                <div className="h-16 flex items-center justify-center mb-4">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={100}
                    height={64}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Partner Description */}
                <p className="text-gray-700 text-base font-medium leading-relaxed">
                  {partner.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
