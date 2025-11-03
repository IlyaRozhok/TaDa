"use client";

import React from "react";
import CardsSlider from "./CardsSlider";

interface Card {
  id: number;
  category?: string;
  title?: string;
  text?: string;
  description?: string;
  image?: string;
  icon?: boolean;
}

const AnimatedCardsContainer = ({
  cards,
  className = "",
}: {
  cards: Card[];
  triggerOffset?: string[];
  className?: string;
}) => {
  return (
    <div className={className}>
      {/* Mobile: Slider */}
      <div className="block lg:hidden">
        <CardsSlider cards={cards} />
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden lg:block px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              {/* Card Header */}
              {card.category && (
                <div className="px-6 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600 font-medium">
                      {card.category}
                    </span>
                    {card.icon && (
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">+</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Image (if exists) */}
              {card.image && (
                <div className="h-64 bg-gray-100 overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title || `Card ${card.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Card Content */}
              {(card.title || card.text || card.description) && (
                <div className="p-6">
                  {card.title && (
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {card.title}
                    </h3>
                  )}
                  <p className="text-gray-700 text-base leading-relaxed">
                    {card.text || card.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedCardsContainer;
