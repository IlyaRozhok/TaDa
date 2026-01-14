"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import RichText from "./RichText";

interface Card {
  id: number;
  image?: string;
  text?: string;
  title?: string;
  description?: string;
  category?: string;
  // Новые поля для rich text
  richText?: string;
  boldText?: string;
}

interface DesktopCardsSliderProps {
  cards: Card[];
}

const DesktopCardsSlider = ({ cards }: DesktopCardsSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    // Show 3 cards + peek of 4th, calculate max index
    const maxIndex = Math.max(0, cards.length - 3);
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Show 3 full cards + peek of 4th
  const canGoNext = currentIndex < Math.max(0, cards.length - 3);
  const canGoPrev = currentIndex > 0;

  // If 4 or fewer cards, show static grid, otherwise show slider
  const showStaticGrid = cards.length <= 4;

  return (
    <div
      className={showStaticGrid ? "container mx-auto px-4" : "relative z-10"}
    >
      {showStaticGrid ? (
        /* Static Grid - No Slider */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-2xl overflow-hidden transition-shadow flex flex-col h-full"
            >
              {/* Card Image */}
              {card.image && (
                <div className="h-64 bg-gray-100 overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.title || `Feature ${card.id}`}
                    width={300}
                    height={256}
                    quality={100}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col">
                {card.category && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600 font-medium">
                      {card.category}
                    </span>
                  </div>
                )}
                {card.title && (
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {card.title}
                  </h3>
                )}
                {(card.richText ||
                  card.boldText ||
                  card.text ||
                  card.description) && (
                  <p className="text-gray-700 text-base leading-relaxed flex-1">
                    {card.richText || card.boldText ? (
                      <RichText text={card.richText} boldText={card.boldText} />
                    ) : (
                      card.text || card.description
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Slider - For 5+ cards */
        <div className="relative w-full z-10">
          {/* Slider Container */}
          <div className="overflow-x-hidden overflow-y-visible">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 28.5}%)`,
                gap: "1rem", // 16px gap
              }}
            >
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex-shrink-0"
                  style={{
                    width: "28%", // ~28% for visible cards + peek
                    minWidth: "28%",
                  }}
                >
                  <div className="bg-white rounded-2xl overflow-hidden transition-shadow h-full flex flex-col">
                    {/* Card Image */}
                    {card.image && (
                      <div className="h-64 bg-gray-100 overflow-hidden">
                        <Image
                          src={card.image}
                          alt={card.title || `Feature ${card.id}`}
                          width={300}
                          height={256}
                          quality={100}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      {card.category && (
                        <div className="mb-4">
                          <span className="text-sm text-gray-600 font-medium">
                            {card.category}
                          </span>
                        </div>
                      )}
                      {card.title && (
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          {card.title}
                        </h3>
                      )}
                      {(card.richText ||
                        card.boldText ||
                        card.text ||
                        card.description) && (
                        <p className="text-gray-700 text-base leading-relaxed flex-1">
                          {card.richText || card.boldText ? (
                            <RichText
                              text={card.richText}
                              boldText={card.boldText}
                            />
                          ) : (
                            card.text || card.description
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mt-8 pr-[12%]">
            <button
              onClick={prevSlide}
              disabled={!canGoPrev}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            <button
              onClick={nextSlide}
              disabled={!canGoNext}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopCardsSlider;
