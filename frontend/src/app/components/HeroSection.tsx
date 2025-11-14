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
        <div className="text-white space-y-4 md:space-y-6 lg:space-y-8 w-full lg:w-1/2 xl:w-[60%]">
          <h1 className="font-sf-pro font-semibold text-5xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[100px] xl:leading-25 pt-10">
            {t(operatorKeys.hero.title)}
          </h1>

          <p className="font-sf-pro font-regular text-xl sm:text-2xl md:text-2xl lg:text-lg xl:text-xl 2xl:text-2xl leading-6 sm:leading-7 lg:leading-7 xl:leading-8 tracking-[0.22px] max-w-xl lg:max-w-lg xl:max-w-2xl">
            {t(operatorKeys.hero.subtitle)}
          </p>
        </div>
      </div>

      {/* MacBook positioned on the right side - desktop and tablets */}
      <div className="absolute pt-20 right-[-10%] lg:right-[-12%] xl:right-[-15%] top-1/2 transform -translate-y-1/2 z-20 hidden lg:block">
        <div className="relative">
          {/* MacBook frame - responsive sizes */}
          <Image
            src="/laptop.png"
            alt="MacBook Pro"
            width={900}
            height={600}
            className="w-[550px] lg:w-[650px] xl:w-[900px] 2xl:w-[900px] h-auto drop-shadow-2xl"
            priority
          />

          {/* MacBook logo on the back */}
          <div className="absolute bottom-[6%] left-1/2 transform -translate-x-1/2">
            <Image
              src="/macbook-logo.png"
              alt="MacBook Logo"
              width={55}
              height={0}
              className="h-2.5"
            />
          </div>

          {/* Website screenshot overlay on MacBook screen - larger */}
          <div className="absolute inset-0 flex items-center justify-center ">
            <div className="w-[82%] h-[88%] mt-[-4%] overflow-hidden rounded-lg">
              <Image
                src="/tada-stage.png"
                alt="TADA Property Website"
                width={800}
                height={600}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile MacBook - smaller and centered */}
      <div className="relative z-10 mt-8 px-4 lg:hidden">
        <div className="relative max-w-xl sm:max-w-2xl mx-auto">
          <Image
            src="/laptop.png"
            alt="MacBook Pro"
            width={600}
            height={400}
            className="w-full h-auto drop-shadow-2xl"
            priority
          />

          {/* MacBook logo on the back */}
          <div className="absolute bottom-[6%] left-1/2 transform -translate-x-1/2">
            <Image
              src="/macbook-logo.png"
              alt="MacBook Logo"
              width={50}
              height={0}
              className="h-1.5 sm:h-2"
            />
          </div>

          {/* Website screenshot overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[82%] h-[88%] mt-[-4%] overflow-hidden rounded">
              <Image
                src="/tada-stage.png"
                alt="TADA Property Website"
                width={600}
                height={400}
                className="w-full h-full object-fit"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
