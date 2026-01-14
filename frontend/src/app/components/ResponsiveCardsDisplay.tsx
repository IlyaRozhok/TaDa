"use client";

import React from "react";
import Image from "next/image";
import CardsSlider from "./CardsSlider";
import DesktopCardsSlider from "./DesktopCardsSlider";
import RichText from "./RichText";

interface Card {
  id: number;
  image?: string;
  text?: string;
  title?: string;
  description?: string;
  category?: string;
  icon?: boolean;
  // Новые поля для rich text
  richText?: string;
  boldText?: string;
}

interface ResponsiveCardsDisplayProps {
  cards: Card[];
}

const ResponsiveCardsDisplay = ({ cards }: ResponsiveCardsDisplayProps) => {
  const sliderLeftPaddingClasses =
    "pl-4 sm:pl-6 md:pl-8 lg:pl-[calc((100vw-1024px)/2+1rem)] xl:pl-[calc((100vw-1280px)/2+1rem)] 2xl:pl-[calc((100vw-1536px)/2+1rem)] pr-0";

  return (
    <>
      {/* Mobile: Always slider */}
      <div className="block lg:hidden">
        <div
          className={`${sliderLeftPaddingClasses} max-w-none overflow-visible`}
        >
          <CardsSlider
            cards={cards.map((card) => ({
              ...card,
              text: card.text || card.description,
              description: card.text || card.description,
            }))}
          />
        </div>
      </div>

      {/* Desktop: Static grid for 4 cards, slider for 5+ cards */}
      <div className="hidden lg:block">
        {cards.length === 4 ? (
          /* Static grid for exactly 4 cards: all in one row */
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-4 gap-6">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl overflow-hidden flex flex-col h-full"
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
              ))}
            </div>
          </div>
        ) : (
          /* Use DesktopCardsSlider for 5+ cards (including Tenants section with 5 cards) */
          <div className="relative z-10 w-full">
            <div className={`${sliderLeftPaddingClasses} max-w-none overflow-visible`}>
              <DesktopCardsSlider cards={cards} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ResponsiveCardsDisplay;
