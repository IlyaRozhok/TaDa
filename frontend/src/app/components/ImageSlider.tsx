"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface ImageCard {
  id: number;
  image: string;
}

interface ImageSliderProps {
  cards: ImageCard[];
}

const ImageSlider = ({ cards }: ImageSliderProps) => {
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
            transform: `translateX(-${currentIndex * 93}%)`,
            minHeight: "400px",
          }}
        >
          {cards.map((card) => (
            <div key={card.id} className="flex-shrink-0 w-[90%]">
              <div className="relative rounded-2xl overflow-hidden h-full">
                <Image
                  src={card.image}
                  alt={`Image ${card.id}`}
                  width={1200}
                  height={800}
                  quality={100}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
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

export default ImageSlider;
