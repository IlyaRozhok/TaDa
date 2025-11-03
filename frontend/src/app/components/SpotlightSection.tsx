"use client";

import React from "react";
import Image from "next/image";
import { useTranslation } from "../hooks/useTranslation";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";

interface SpotlightSectionProps {
  onBookClick?: () => void;
}

const SpotlightSection = ({ onBookClick }: SpotlightSectionProps) => {
  const { t } = useTranslation();
  const spotlightImages = [
    {
      id: 1,
      src: "/spotlight-1.png",
      alt: "Modern apartment living room",
    },
    {
      id: 2,
      src: "/spotlight-2.png",
      alt: "Apartment balcony view",
    },
    { id: 3, src: "/spotlight-3.png", alt: "Contemporary kitchen" },
    { id: 4, src: "/spotlight-4.png", alt: "Dining area" },
    { id: 5, src: "/spotlight-6.png", alt: "Bedroom interior" },
    { id: 6, src: "/spotlight-5.png", alt: "Bathroom design" },
    { id: 7, src: "/spotlight-7.png", alt: "Living space" },
    { id: 8, src: "/spotlight-8.png", alt: "Kitchen detail" },
  ];

  return (
    <section id="spotlight" className="md:pt-20 pt-5 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sf-pro font-semibold text-gray-900 leading-tight max-w-4xl mb-8 mt-5">
            {t(operatorKeys.spotlight.title)}
          </h2>
          <p className="text-gray-700 text-lg mb-12 max-w-2xl">
            {t(operatorKeys.spotlight.subtitle)}
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl">
            {/* Feature 1 */}
            <div className="grid grid-cols-[24px,1fr] items-start gap-x-3">
              <Image
                className="w-8"
                src="/camera.svg"
                alt="camera"
                width={24}
                height={24}
              />
              <div className="space-y-1">
                <p className="text-gray-900 mt-2 leading-relaxed">
                  {t(operatorKeys.spotlight.capture)}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid grid-cols-[24px,1fr] items-start gap-x-3">
              <Image
                className="w-6"
                src="/building.svg"
                alt="building"
                width={24}
                height={24}
              />
              <div className="space-y-1">
                <p className="text-gray-900 mt-2 leading-relaxed">
                  {t(operatorKeys.spotlight.promote)}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid grid-cols-[24px,1fr] items-start gap-x-3">
              <Image
                className="w-8"
                src="/addCard.svg"
                alt="addCard"
                width={24}
                height={24}
              />
              <div className="space-y-1">
                <p className="text-gray-900 mt-2 leading-relaxed">
                  {t(operatorKeys.spotlight.onboard)}
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="grid grid-cols-[24px,1fr] items-start gap-x-3">
              <Image
                className="w-8"
                src="/verify.svg"
                alt="verify"
                width={24}
                height={24}
              />
              <div className="space-y-1">
                <p className="text-gray-900 mt-2 leading-relaxed">
                  {t(operatorKeys.spotlight.verify)}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onBookClick}
            className="bg-black w-full sm:w-[300px] cursor-pointer text-white px-8 py-4 rounded-full font-semibold hover:bg-black/20 hover:text-black transition-colors mb-8"
          >
            {t(operatorKeys.spotlight.ctaBtn)}
          </button>

          <p className="text-gray-700 text-base mb-12">
            {t(operatorKeys.spotlight.notice)}
          </p>
        </div>

        {/* Adaptive Image Grid - Exact layout from reference */}
        <div className="mx-auto">
          {/* Mobile: Simple 2 column grid */}
          <div className="md:hidden grid grid-cols-2 gap-4">
            {spotlightImages.map((image) => (
              <div
                key={image.id}
                className="aspect-square overflow-hidden rounded-2xl"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
          <div className="hidden md:block relative h-[400px] lg:h-[400px] xl:h-[400px]">
            <div className="absolute left-0 top-0 w-[25%] h-full">
              <div className="flex flex-col gap-2 h-full">
                <div className="h-[59%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={spotlightImages[0].src}
                      alt={spotlightImages[0].alt}
                      width={500}
                      height={300}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                <div className="h-[50%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={spotlightImages[7].src}
                      alt={spotlightImages[7].alt}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute left-[25.5%] top-0 w-[39%] h-full">
              <div className="flex flex-col gap-2 h-full">
                <div className="h-[49%] flex gap-2">
                  <div className="w-[70%]">
                    <div className="h-full overflow-hidden rounded-2xl">
                      <Image
                        src={spotlightImages[1].src}
                        alt={spotlightImages[1].alt}
                        width={700}
                        height={300}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  <div className="w-[38%]">
                    <div className="h-full overflow-hidden rounded-2xl">
                      <Image
                        src={spotlightImages[2].src}
                        alt={spotlightImages[2].alt}
                        width={1200}
                        height={400}
                        className="w-full h-full object-top hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-[60%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={spotlightImages[5].src}
                      alt={spotlightImages[5].alt}
                      width={700}
                      height={300}
                      className="w-full h-full object-center hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-0 w-[35%] h-full">
              <div className="flex flex-col gap-2 h-full">
                <div className="h-[51%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={spotlightImages[3].src}
                      alt={spotlightImages[3].alt}
                      width={1200}
                      height={400}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                <div className="h-[58%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={spotlightImages[4].src}
                      alt={spotlightImages[4].alt}
                      height={1241}
                      width={573}
                      className="w-full h-full object-fill hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotlightSection;
