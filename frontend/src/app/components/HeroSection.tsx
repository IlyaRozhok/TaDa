"use client";

import React from "react";
import Image from "next/image";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";
import { useTranslation } from "../hooks/useTranslation";

const HeroSection = () => {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Text content positioned on the left */}
      <div className="relative z-20 container mx-auto px-4 pt-24 md:pt-32 lg:pt-0 lg:flex lg:items-center lg:min-h-screen">
        <div className="text-white space-y-4 md:space-y-6 lg:space-y-8 w-full lg:w-1/2">
          <h1 className="font-semibold text-5xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[100px] xl:leading-18 2xl:leading-25 pt-10">
            {t(operatorKeys.hero.title)}
          </h1>

          <p className="font-regular text-xl sm:text-2xl md:text-2xl lg:text-lg xl:text-xl 2xl:text-2xl leading-6 sm:leading-7 lg:leading-7 xl:leading-8 tracking-[0.22px] max-w-xl lg:max-w-lg xl:max-w-2xl">
            {t(operatorKeys.hero.subtitle)}
          </p>
        </div>
      </div>

      {/* App preview positioned on the right side - desktop and tablets */}
      <div className="absolute right-[2%] top-1/2 transform -translate-y-1/2 z-20 hidden lg:block w-[46%] max-w-[900px]">
        <Image
          src="/tada-stage.webp"
          alt="TADA Property Website"
          width={1176}
          height={660}
          className="w-full h-auto rounded-2xl shadow-2xl"
          priority
        />
      </div>

      {/* Mobile app preview - centered */}
      <div className="relative z-10 mt-8 px-4 lg:hidden">
        <Image
          src="/tada-stage.webp"
          alt="TADA Property Website"
          width={1176}
          height={660}
          className="w-full sm:max-w-2xl mx-auto h-auto rounded-xl shadow-2xl"
          priority
        />
      </div>
    </div>
  );
};

export default HeroSection;
