"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import LandingSwitcher, { LandingType } from "./LandingSwitcher";
import RequestDemoModal from "./RequestDemoModal";

import CardsSlider from "./CardsSlider";
import DesktopCardsSlider from "./DesktopCardsSlider";
import ResponsiveCardsDisplay from "./ResponsiveCardsDisplay";

// Import existing components for operators landing
import HeroWrapper from "./HeroWrapper";
import CardsSection from "./CardsSection";
import TenantsWrapper from "./TenantsWrapper";
import SpotlightSection from "./SpotlightSection";
import SocialMediaSection from "./SocialMediaSection";
import TenantsSocialMediaSection from "./TenantsSocialMediaSection";
import AboutUsSection from "./AboutUsSection";
import PartnersSection from "./PartnersSection";
import Footer from "./Footer";
import Header from "./Header";
import { useTranslation } from "../hooks/useTranslation";
import { tenantKeys } from "../lib/translationsKeys/tenantTranslationKeys";

// Tenant-focused hero section with background image
const TenantsHeroSection = ({
  onContactClick,
}: {
  onContactClick?: () => void;
}) => {
  const { t } = useTranslation();
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
    <section id="hero" className="relative min-h-screen overflow-hidden pb-5">
      {/* Background color fallback - matching image colors */}
      <div className="absolute inset-0 bg-black"></div>
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/tenant-landing-bg.png"
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

      {/* Overlay for better text readability */}

      {/* Text content positioned on the left */}
      <div className="relative z-20 mt-12 container mx-auto px-4 pt-24 md:pt-32 lg:pt-0 lg:flex lg:items-center lg:min-h-screen">
        <div className="text-white space-y-4 md:space-y-6 lg:space-y-6 xl:space-y-8 w-full lg:max-w-[45%] xl:max-w-[50%] 2xl:max-w-[55%]">
          <h1 className="font-sf-pro font-semibold text-5xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-7xl 2xl:text-8xl max-w-[700px] 2xl:leading-[100px]">
            {t(tenantKeys.hero.title)}
          </h1>
          <p className="font-sf-pro font-regular text-lg sm:text-xl md:text-xl lg:text-lg xl:text-xl 2xl:text-2xl leading-6 sm:leading-7 lg:leading-6 xl:leading-7 2xl:leading-8 tracking-[0.22px] max-w-xl md:max-w-2xl lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
            {t(tenantKeys.hero.subtitle)}
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            <button
              onClick={onContactClick}
              className="bg-white text-black w-full sm:w-auto hover:text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-black transition-colors shadow-lg cursor-pointer"
            >
              {t(tenantKeys.hero.ctaBtn)}
            </button>
          </div>
        </div>
      </div>

      {/* MacBook positioned on the right side - desktop and tablets */}
      <div className="absolute right-[-8%] lg:right-[-10%] xl:right-[-12%] 2xl:right-[-15%] top-1/2 transform -translate-y-1/2 z-20 hidden lg:block mt-1.5">
        <div className="relative">
          {/* MacBook frame - responsive sizes */}
          <Image
            src="/laptop.png"
            alt="MacBook Pro"
            width={900}
            height={600}
            className="w-[500px] lg:w-[580px] xl:w-[750px] 2xl:w-[900px] h-auto drop-shadow-2xl"
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

          {/* Website screenshot overlay on MacBook screen */}
          <div className="absolute inset-0 flex items-center justify-center">
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
            <div className="w-[82%] h-[88%] mt-[-4%] overflow-hidden rounded-lg">
              <Image
                src="/tada-stage.png"
                alt="TADA Property Website"
                width={600}
                height={400}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TenantsCardsSection = ({
  onContactClick,
}: {
  onContactClick?: () => void;
}) => {
  const { t } = useTranslation();
  const cards = [
    {
      id: 1,
      category: t(tenantKeys.rentSection.card1.label),
      title: t(tenantKeys.rentSection.card1.title),
      text: t(tenantKeys.rentSection.card1.description),
      icon: true,
    },
    {
      id: 2,
      category: t(tenantKeys.rentSection.card2.label),
      title: t(tenantKeys.rentSection.card2.title),
      text: t(tenantKeys.rentSection.card2.description),
      icon: true,
    },
    {
      id: 3,
      category: t(tenantKeys.rentSection.card3.label),
      title: t(tenantKeys.rentSection.card3.title),
      text: t(tenantKeys.rentSection.card3.description),
      icon: true,
    },
    {
      id: 4,
      category: t(tenantKeys.rentSection.card4.label),
      title: t(tenantKeys.rentSection.card4.title),
      text: t(tenantKeys.rentSection.card4.description),
      icon: true,
    },
    {
      id: 5,
      category: t(tenantKeys.rentSection.card5.label),
      title: t(tenantKeys.rentSection.card5.title),
      text: t(tenantKeys.rentSection.card5.description),
      icon: true,
    },
  ];

  return (
    <section
      id="cards"
      className="md:py-20 py-5 bg-gradient-to-b from-white to-[#F5F5F7] overflow-hidden"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center lg:text-start mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sf-pro font-semibold text-gray-900 max-w-4xl lg:mx-0 mx-auto mt-6">
            {t(tenantKeys.rentSection.title)}
          </h2>
          <p className="text-gray-600 text-lg mt-6 max-w-[500px] lg:mx-0 mx-auto">
            {t(tenantKeys.rentSection.subtitle)}
          </p>
        </div>
      </div>

      {/* Responsive Cards Display */}
      <ResponsiveCardsDisplay cards={cards} />

      {/* Contact Us Button */}
      <div className="text-center mt-6 md:mt-16 px-4">
        <button
          onClick={onContactClick}
          className="bg-black w-auto text-white px-12 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 hover:text-black transition-colors cursor-pointer"
        >
          {t(tenantKeys.rentSection.ctaBtn)}
        </button>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TenantsBTRSection = () => {
  const { t } = useTranslation();
  const partners = [
    {
      id: 1,
      name: "Greystar",
      logo: "/greystar.svg",
      highlighted: false,
    },
    {
      id: 2,
      name: "Way of Life",
      logo: "/wayoflife.svg",
      highlighted: false,
    },
    {
      id: 3,
      name: "Uncle",
      logo: "/uncle.svg",
      highlighted: false,
    },
    {
      id: 4,
      name: "Moda Living",
      logo: "/moda.svg",
      highlighted: false,
    },
  ];

  return (
    <section className="md:py-20 py-5 bg-white border-gray-100">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sf-pro font-semibold text-gray-900 mb-8">
            {t(tenantKeys.btr.title)}
          </h2>
        </div>

        {/* Partners Grid */}
        <div className="max-w-6xl mx-auto">
          {/* Top Row - 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {partners.slice(0, 3).map((partner) => (
              <div
                key={partner.id}
                className="p-8 rounded-4xl text-center border border-gray-200 bg-white"
              >
                {/* Partner Logo */}
                <div className="h-10 flex items-center justify-center">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={150}
                    height={64}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Row - 1 card centered */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-md mx-auto">
            {partners.slice(3, 4).map((partner) => (
              <div
                key={partner.id}
                className="p-8 rounded-4xl text-center border border-gray-200 bg-white"
              >
                {/* Partner Logo */}
                <div className="h-16 flex items-center justify-center">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={90}
                    height={64}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const TenantsFeaturesSection = () => {
  const { t } = useTranslation();
  const features = [
    {
      id: 1,
      image: "/ten-feat-1.png",
      boldText: t(tenantKeys.relocation.card1.title),
      richText: t(tenantKeys.relocation.card1.description),
    },
    {
      id: 2,
      image: "/ten-feat-2.png",
      boldText: t(tenantKeys.relocation.card2.title),
      richText: t(tenantKeys.relocation.card2.description),
    },
    {
      id: 3,
      image: "/ten-feat-3.png",
      boldText: t(tenantKeys.relocation.card3.title),
      richText: t(tenantKeys.relocation.card3.description),
    },
    {
      id: 4,
      image: "/ten-feat-4.png",
      boldText: t(tenantKeys.relocation.card4.title),
      richText: t(tenantKeys.relocation.card4.description),
    },
    {
      id: 5,
      image: "/ten-feat-5.png",
      boldText: t(tenantKeys.relocation.card5.title),
      richText: t(tenantKeys.relocation.card5.description),
    },
    {
      id: 6,
      image: "/ten-feat-7.png",
      boldText: t(tenantKeys.relocation.card6.title),
      richText: t(tenantKeys.relocation.card6.description),
    },
  ];

  const sliderLeftPaddingClasses =
    "pl-4 sm:pl-6 md:pl-8 lg:pl-[calc((100vw-1024px)/2+1rem)] xl:pl-[calc((100vw-1280px)/2+1rem)] 2xl:pl-[calc((100vw-1536px)/2+1rem)] pr-0";

  return (
    <section
      id="relocation-support"
      className="md:py-22 pt-10 bg-gray-100 overflow-hidden"
    >
      {/* Section Header with padding */}
      <div className="container mx-auto px-4 mb-12">
        <div className="text-center lg:text-start">
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sf-pro font-semibold text-gray-900 leading-tight max-w-4xl lg:mx-0 mx-auto mb-8">
            {t(tenantKeys.relocation.title)}
          </h2>
          <p className="text-gray-700 text-lg max-w-2xl lg:mx-0 mx-auto">
            {t(tenantKeys.relocation.subtitle)}
          </p>
        </div>
      </div>

      {/* Mobile: Slider with padding */}
      <div className="block lg:hidden">
        <div
          className={`${sliderLeftPaddingClasses} max-w-none overflow-visible`}
        >
          <CardsSlider cards={features} />
        </div>
      </div>

      {/* Desktop: Slider without right padding */}
      <div className="hidden lg:block">
        <div
          className={`${sliderLeftPaddingClasses} max-w-none overflow-visible`}
        >
          <DesktopCardsSlider cards={features} />
        </div>
      </div>
    </section>
  );
};

const GenerationRentSection = ({
  onContactClick,
}: {
  onContactClick?: () => void;
}) => {
  const { t } = useTranslation();
  const genRentImages = [
    {
      id: 1,
      src: "/gen-rent-1.png",
      alt: "Community living space",
    },
    {
      id: 2,
      src: "/gen-rent-2.png",
      alt: "Modern amenities",
    },
    { id: 3, src: "/gen-rent-3.png", alt: "Professional management" },
    { id: 4, src: "/gen-rent-4.png", alt: "Vetted properties" },
    { id: 5, src: "/gen-rent-5.png", alt: "Community area" },
    { id: 6, src: "/gen-rent-6.png", alt: "Modern kitchen" },
    { id: 7, src: "/gen-rent-7.png", alt: "Living space" },
    { id: 8, src: "/gen-rent-8.png", alt: "Bedroom interior" },
  ];

  return (
    <section id="generation-rent" className="mt-10 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sf-pro font-semibold text-gray-900 leading-tight max-w-4xl mb-3 mt-4">
            {t(tenantKeys.generation.title)}
          </h2>
          <p className="text-gray-900 text-lg mb-12 max-w-xl">
            {t(tenantKeys.generation.subtitle)}
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mb-12 max-w-4xl">
            {/* Feature 1: Community Living */}
            <div className="grid grid-cols-[24px,1fr] items-start gap-x-2">
              <div className="flex items-center">
                <Image
                  className="w-7"
                  src="/community-icon.svg"
                  alt="Community"
                  width={30}
                  height={30}
                />
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  {t(tenantKeys.generation.communityCard.title)}
                </h3>
              </div>

              <div className="space-y-1 mb-8">
                <p className="text-gray-700 leading-relaxed mt-3">
                  {t(tenantKeys.generation.communityCard.description)}
                </p>
              </div>
            </div>

            {/* Feature 2: Amenities That Matter */}
            <div className="grid grid-cols-[24px,1fr] items-start gap-x-3 gap-y-4">
              <div className="flex items-center">
                <Image
                  className="w-6"
                  src="/building.svg"
                  alt="Building"
                  width={24}
                  height={24}
                />
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  {t(tenantKeys.generation.amenitiesCard.title)}
                </h3>
              </div>

              <div className="space-y-1">
                <p className="text-gray-700 leading-relaxed pb-3">
                  {t(tenantKeys.generation.amenitiesCard.description)}
                </p>
              </div>
            </div>

            {/* Feature 3: Professionally Managed */}
            <div className="grid grid-cols-[24px,1fr] items-start mt-5">
              <div className="flex items-center-safe">
                <Image
                  className="w-6"
                  src="/like-icon.svg"
                  alt="Like"
                  width={24}
                  height={24}
                />
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  {t(tenantKeys.generation.professionalCard.title)}
                </h3>
              </div>
              <div className="space-y-1">
                <p className="text-gray-700 leading-relaxed pt-3">
                  {t(tenantKeys.generation.professionalCard.description)}
                </p>
              </div>
            </div>

            {/* Feature 4: Vetted by Us */}
            <div className="grid grid-cols-[24px,1fr] items-start mt-5">
              <div className="flex items-center-safe">
                <Image
                  className="w-6"
                  src="/verify-tenant-icon.svg"
                  alt="Verify"
                  width={24}
                  height={24}
                />
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  {t(tenantKeys.generation.vettedCard.title)}
                </h3>
              </div>

              <div className="space-y-1">
                <p className="text-gray-700 leading-relaxed pt-3 md:pt-0">
                  {t(tenantKeys.generation.vettedCard.description)}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onContactClick}
            className="bg-black w-auto cursor-pointer text-white px-8 py-4 rounded-full font-semibold hover:bg-black/20 hover:text-black transition-colors mb-8"
          >
            {t(tenantKeys.generation.ctaBtn)}
          </button>

          <p className="text-gray-700 text-base mb-12">
            {t(tenantKeys.generation.notice)}
          </p>
        </div>

        {/* Adaptive Image Grid - Same layout as Spotlight */}
        <div className=" mx-auto">
          {/* Mobile: Simple 2 column grid */}
          <div className="md:hidden grid grid-cols-2 gap-4">
            {genRentImages.map((image) => (
              <div
                key={image.id}
                className="aspect-square overflow-hidden rounded-2xl"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          {/* Desktop: Exact masonry layout matching Spotlight */}
          <div className="hidden md:block relative h-[500px] lg:h-[550px] xl:h-[520px]">
            {/* Left column - 2 images with different heights */}
            <div className="absolute left-0 top-0 w-[25%] h-full">
              <div className="flex flex-col gap-2 h-full">
                {/* Top left - larger height */}
                <div className="h-[60%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={genRentImages[0].src}
                      alt={genRentImages[0].alt}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Bottom left - smaller height */}
                <div className="h-[38%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={genRentImages[6].src}
                      alt={genRentImages[6].alt}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Center area - 3 images */}
            <div className="absolute left-[25.5%] top-0 w-[59.5%] h-full">
              <div className="flex flex-col gap-2 h-full">
                {/* Top row - 2 images with different widths */}
                <div className="h-[48%] flex gap-2">
                  {/* Top center left - wider */}
                  <div className="w-[180%]">
                    <div className="h-full overflow-hidden rounded-2xl">
                      <Image
                        src={genRentImages[1].src}
                        alt={genRentImages[1].alt}
                        width={500}
                        height={300}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Top center right - narrower */}
                  <div className="w-[58%]">
                    <div className="h-full overflow-hidden rounded-2xl">
                      <Image
                        src={genRentImages[2].src}
                        alt={genRentImages[2].alt}
                        width={500}
                        height={300}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom center - full width */}
                <div className="h-[50%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={genRentImages[5].src}
                      alt={genRentImages[5].alt}
                      width={1500}
                      height={500}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - 2 stacked images with different heights */}
            <div className="absolute right-0 top-0 w-[14.5%] h-full">
              <div className="flex flex-col gap-2 h-full">
                {/* Top right - larger height */}
                <div className="h-[60%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={genRentImages[3].src}
                      alt={genRentImages[3].alt}
                      width={1200}
                      height={400}
                      className="w-full h-full object-fill hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Bottom right - smaller height */}
                <div className="h-[38%]">
                  <div className="h-full overflow-hidden rounded-2xl">
                    <Image
                      src={genRentImages[4].src}
                      alt={genRentImages[4].alt}
                      width={500}
                      height={500}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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

interface DualLandingWrapperProps {
  onSignIn: () => void;
}

const DualLandingWrapper: React.FC<DualLandingWrapperProps> = ({
  onSignIn,
}) => {
  const [currentType, setCurrentType] = useState<LandingType>("operators");
  const [isRequestDemoOpen, setIsRequestDemoOpen] = useState(false);

  const handleSwitch = (newType: LandingType) => {
    if (newType === currentType) return;
    setCurrentType(newType);
    // Scroll to top when switching modes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderOperatorsLanding = () => (
    <>
      <HeroWrapper />
      <CardsSection />
      <PartnersSection landingType="operators" />
      <TenantsWrapper />
      <SpotlightSection onBookClick={() => setIsRequestDemoOpen(true)} />
      <SocialMediaSection />
      <AboutUsSection />
      <Footer />
    </>
  );

  const renderTenantsLanding = () => (
    <>
      <TenantsHeroSection onContactClick={() => setIsRequestDemoOpen(true)} />
      <TenantsCardsSection onContactClick={() => setIsRequestDemoOpen(true)} />
      <GenerationRentSection
        onContactClick={() => setIsRequestDemoOpen(true)}
      />
      <TenantsFeaturesSection />
      <TenantsSocialMediaSection />
      <PartnersSection landingType="tenants" />
      <AboutUsSection />
      <Footer />
    </>
  );

  return (
    <>
      {/* Header with switcher */}
      <Header onSignIn={onSignIn} landingType={currentType}>
        <div className="flex items-center gap-4 min-w-[160px]">
          <LandingSwitcher
            currentType={currentType}
            onSwitch={handleSwitch}
            isLoading={false}
          />
        </div>
      </Header>

      {/* Dynamic content based on current type */}
      {currentType === "operators"
        ? renderOperatorsLanding()
        : renderTenantsLanding()}

      {/* Request Demo Modal */}
      <RequestDemoModal
        isOpen={isRequestDemoOpen}
        onClose={() => setIsRequestDemoOpen(false)}
        landingType={currentType}
      />
    </>
  );
};

export default DualLandingWrapper;
