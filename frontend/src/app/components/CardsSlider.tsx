"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RichText from "./RichText";

interface Card {
  id: number;
  image?: string;
  title?: string;
  text?: string;
  description?: string;
  category?: string;
  icon?: boolean;
  // Новые поля для rich text
  richText?: string;
  boldText?: string;
}

interface CardsSliderProps {
  cards: Card[];
}

const CardsSlider = ({ cards }: CardsSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < cards.length - 1) {
      nextCard();
    }
    if (isRightSwipe && currentIndex > 0) {
      prevCard();
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Calculate transform based on current index
  const getTransform = () => {
    return `translateX(-${currentIndex * 93}%)`;
  };

  // Check if any card has an image to determine container height
  const hasImages = cards.some((card) => card.image);
  const containerMinHeight = hasImages ? "180px" : "180px";

  return (
    <div className="relative">
      {/* Slider Container */}
      <div
        className="overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex gap-3 transition-transform duration-300 ease-in-out"
          style={{
            transform: getTransform(),
            minHeight: containerMinHeight,
          }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex-shrink-0"
              style={{
                width: "90%",
              }}
            >
              <div className="relative bg-white rounded-2xl overflow-hidden h-full flex flex-col ml-4">
                {/* Card Image */}
                {card.image && (
                  <div className="h-64 bg-gray-100 overflow-hidden flex items-center justify-center">
                    <img
                      src={card.image}
                      alt={card.title || card.text || `Card ${card.id}`}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                )}

                {/* Card Content */}
                {(card.category ||
                  card.title ||
                  card.text ||
                  card.description ||
                  card.richText ||
                  card.boldText) && (
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
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-4 my-4 md:mt-8">
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <button
          onClick={nextCard}
          disabled={currentIndex === cards.length - 1}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </div>
  );
};

export default CardsSlider;
